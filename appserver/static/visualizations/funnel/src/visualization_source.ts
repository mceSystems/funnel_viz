// @ts-expect-error
define(["api/SplunkVisualizationBase", "api/SplunkVisualizationUtils", "echarts"], function (
  // @ts-expect-error
  SplunkVisualizationBase,
  // @ts-expect-error
  SplunkVisualizationUtils,
  // @ts-expect-error
  echarts
) {
  return SplunkVisualizationBase.extend({
    initialize: function () {
      this.chunk = 100;
      this.offset = 0;
      SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
      this.el.classList.add("vizviz-funnel-container");
    },

    // @ts-expect-error
    formatData: function (data) {
      if (data.columns.length == 0) {
        return data;
      }

      if (data.columns[0].length > 100) {
        throw new SplunkVisualizationBase.VisualizationError("This visualization supports up to 100 results.");
      }
      return data;
    },

    // @ts-expect-error
    updateView: function (data, config) {
      if (!data.columns || data.columns.length === 0) {
        return this;
      }

      const c = this.initChart(this.el);
      const conf = new Config(config, SplunkVisualizationUtils.getCurrentTheme());
      const opt = option(data, conf);
      console.log(opt);
      console.log(data);
      c.setOption(opt);
    },

    getInitialDataParams: function () {
      return {
        outputMode: SplunkVisualizationBase.COLUMN_MAJOR_OUTPUT_MODE,
        count: 100,
      };
    },

    reflow: function () {
      echarts.getInstanceByDom(this.el)?.resize();
    },

    initChart: function (e: HTMLElement) {
      if (SplunkVisualizationUtils.getCurrentTheme() == "dark") {
        return echarts.init(e, "dark");
      }
      return echarts.init(e);
    },
  });
});

// TypeScript from here

interface Field {
  name: string;
  splitby_value?: string;
}

type Result = string[] | number[];

interface SearchResult {
  fields: Field[];
  columns: Result[];
}

class Config {
  background: string;
  foreground: string;
  funnelType: "classic" | "alternative";
  funnelAlign: "left" | "center" | "right";
  labelPosition: "left" | "inside" | "right";
  itemSize: number;
  #colors = [
    "#2ec7c9",
    "#b6a2de",
    "#5ab1ef",
    "#ffb980",
    "#d87a80",
    "#8d98b3",
    "#e5cf0d",
    "#97b552",
    "#95706d",
    "#dc69aa",
    "#07a2a4",
    "#9a7fd1",
    "#588dd5",
    "#f5994e",
    "#c05050",
    "#59678c",
    "#c9ab00",
    "#7eb00a",
    "#6f5553",
    "#c14089",
  ];
  #vizNamespace = "display.visualizations.custom.funnel_viz.funnel";

  constructor(c: any, mode: string) {
    this.background = mode === "dark" ? "#333" : "#fff";
    this.foreground = mode === "dark" ? "#fff" : "#333";
    this.funnelType = c[`${this.#vizNamespace}.funnelType`] === "classic" ? "classic" : "alternative";
    this.funnelAlign = ["left", "center", "right"].includes(c[`${this.#vizNamespace}.funnelAlign`])
      ? c[`${this.#vizNamespace}.funnelAlign`]
      : "left";
    this.labelPosition = ["left", "inside", "right"].includes(c[`${this.#vizNamespace}.labelPosition`])
      ? c[`${this.#vizNamespace}.labelPosition`]
      : "left";
    this.itemSize = this.validateItemSize(c[`${this.#vizNamespace}.itemSize`]);
    this.colors = c;
  }

  sanitizeNumber(s: string): number | "" {
    return !Number.isNaN(parseInt(s)) ? parseInt(s) : "";
  }

  validateItemSize(rad: string): number {
    const d = this.sanitizeNumber(rad);
    return d === "" ? 96 : d;
  }

  isColor(hex: string) {
    return /^#[0-9a-f]{6}|#[0-9a-f]{3}$/i.test(hex);
  }

  get colors() {
    return this.#colors;
  }

  set colors(c: any) {
    for (let i = 0; i < this.#colors.length; i++) {
      if (this.isColor(c[`${this.#vizNamespace}.color${i + 1}`])) {
        this.#colors[i] = c[`${this.#vizNamespace}.color${i + 1}`];
      }
    }
  }

  get firstGridLeft() {
    return this.itemSize / 2 + 48;
  }
}

function bar(result: Result, conf: Config) {
  return {
    type: "bar",
    // silent: true,
    zlevel: 1,
    colorBy: "data",
    barCategoryGap: "20%",
    barWidth: conf.itemSize,
    label: {
      position: "insideLeft",
      show: true,
      // align: "left",
      distance: 16,
      verticalAlign: "middle",
      formatter: "{name|{b}}\n{c}%",
      rich: {
        name: {
          fontWeight: 700,
          lineHeight: 24,
        },
      },
    },
    data: result,
  };
}

function area(result: Result) {
  return {
    type: "line",
    silent: true,
    showSymbol: false,
    areaStyle: {
      color: "#ddd",
    },
    lineStyle: {
      width: 0,
    },
    data: result,
  };
}

function graph(result: Result, conf: Config) {
  const links = [];

  for (let i = 0; i < result.length - 1; i++) {
    links.push({ source: i, target: i + 1 });
  }

  return {
    type: "graph",
    coordinateSystem: "cartesian2d",
    xAxisIndex: 1,
    yAxisIndex: 1,
    symbolSize: conf.itemSize,
    // silent: true,
    lineStyle: {
      width: 16,
      color: "#ddd",
    },
    data: result.map((x, i) => {
      return {
        value: 0,
        label: { formatter: x, show: true, fontSize: 14, fontWeight: 700 },
        itemStyle: { color: conf.colors[i % conf.colors.length] },
      };
    }),
    links: links,
  };
}

function sharedOption(conf: Config) {
  return {
    toolbox: {
      feature: {
        saveAsImage: {
          backgroundColor: conf.background,
          name: "funnel-chart",
        },
      },
    },
    color: conf.colors,
    backgroundColor: "transparent",
  };
}

function alternateOption(data: SearchResult, conf: Config) {
  return {
    ...sharedOption(conf),
    grid: [
      {
        left: conf.firstGridLeft,
        right: 32,
        bottom: 32,
        containLabel: true,
      },
      {
        left: 32,
        right: 32,
        bottom: 32,
        containLabel: true,
      },
    ],
    xAxis: [
      {
        type: "value",
        boundaryGap: [0, 0.01],
        show: false,
      },
      {
        type: "value",
        boundaryGap: [0, 0.01],
        gridIndex: 1,
        show: false,
      },
    ],
    yAxis: [
      {
        type: "category",
        show: false,
        inverse: true,
        data: data.columns[0],
      },
      {
        type: "category",
        gridIndex: 1,
        show: false,
        inverse: true,
        data: data.columns[0],
      },
    ],
    series: [bar(data.columns[1], conf), area(data.columns[1]), graph(data.columns[2], conf)],
  };
}

function classicOption(data: SearchResult, conf: Config) {
  return {
    ...sharedOption(conf),
    series: [
      {
        type: "funnel",
        width: "80%",
        min: 0,
        max: 100,
        minSize: "0%",
        maxSize: "100%",
        sort: "none",
        funnelAlign: conf.funnelAlign,
        gap: 2,
        label: {
          position: conf.labelPosition,
          show: true,
          rich: {
            name: {
              fontWeight: 700,
              lineHeight: 24,
            },
          },
        },
        itemStyle: {
          borderColor: "#fff",
          borderWidth: 1,
        },
        data: data.columns[2].map((v, i) => {
          return {
            value: v,
            label: { formatter: `{name|${data.columns[0][i]}}\n${data.columns[1][i]} (${v}%)` },
          };
        }),
      },
    ],
  };
}

function option(data: SearchResult, conf: Config) {
  return conf.funnelType == "classic" ? classicOption(data, conf) : alternateOption(data, conf);
}
