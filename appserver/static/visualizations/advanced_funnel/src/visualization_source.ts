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
      this.el.classList.add("advanced-funnel-viz-container");
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
    onConfigChange: function (configChanges, _previousConfig) {
      if (
        Object.keys(configChanges).length == 1 &&
        configChanges.hasOwnProperty("display.visualizations.custom.advanced_funnel_viz.advanced_funnel.funnelType")
      ) {
        echarts.getInstanceByDom(this.el).dispose();
      }

      this.invalidateFormatData();
    },

    // @ts-expect-error
    updateView: function (data, config) {
      if (!data.columns || data.columns.length === 0) {
        return this;
      }

      const c = this.initChart(this.el);
      const conf = new Config(config, SplunkVisualizationUtils.getCurrentTheme());
      const opt = option(data, conf);
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
  gray: string;
  funnelType: "classic" | "hybrid";
  funnelAlign: "left" | "center" | "right";
  labelPosition: "left" | "right";
  classicWidth: number;
  hybridWidth: number;
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
  #vizNamespace = "display.visualizations.custom.advanced_funnel_viz.advanced_funnel";

  constructor(c: any, mode: string) {
    this.background = mode === "dark" ? "#333" : "#fff";
    this.foreground = mode === "dark" ? "#fff" : "#333";
    this.gray = mode === "dark" ? "#414445" : "#ddd";
    this.funnelType = c[`${this.#vizNamespace}.funnelType`] === "classic" ? "classic" : "hybrid";
    this.funnelAlign = ["left", "center", "right"].includes(c[`${this.#vizNamespace}.funnelAlign`])
      ? c[`${this.#vizNamespace}.funnelAlign`]
      : "center";
    this.labelPosition = ["left", "right"].includes(c[`${this.#vizNamespace}.labelPosition`])
      ? c[`${this.#vizNamespace}.labelPosition`]
      : "left";
    const isize = this.sanitizeNumber(c[`${this.#vizNamespace}.itemSize`]);
    this.itemSize = isize !== false ? isize : 96;
    const cw = this.sanitizeNumber(c[`${this.#vizNamespace}.classicWidth`]);
    this.classicWidth = cw !== false ? cw : 300;
    const hw = this.sanitizeNumber(c[`${this.#vizNamespace}.hybridWidth`]);
    this.hybridWidth = hw !== false ? hw : 828;
    this.colors = c;
  }

  sanitizeNumber(s: string): number | false {
    return !Number.isNaN(parseInt(s)) ? parseInt(s) : false;
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

  get firstGridWidth() {
    return this.hybridWidth - 128;
  }
}

function bar(result: Result, conf: Config) {
  return {
    type: "bar",
    zlevel: 1,
    colorBy: "data",
    barCategoryGap: "20%",
    barWidth: conf.itemSize,
    label: {
      position: "insideLeft",
      show: true,
      distance: 16,
      verticalAlign: "middle",
      formatter: "{name|{b}}\n{c}",
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

function area(result: Result, conf: Config) {
  return {
    type: "line",
    silent: true,
    showSymbol: false,
    areaStyle: {
      color: conf.gray,
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
    lineStyle: {
      width: 16,
      color: conf.gray,
    },
    data: result.map((x, i) => {
      return {
        value: 0,
        label: { formatter: `${x}%`, show: true, fontSize: 14, fontWeight: 700 },
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
        bottom: 32,
        containLabel: true,
        width: conf.firstGridWidth,
        left: "center",
      },
      {
        bottom: 32,
        containLabel: true,
        width: conf.hybridWidth,
        left: "center",
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
        offset: -40,
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
    series: [bar(data.columns[1], conf), area(data.columns[1], conf), graph(data.columns[2], conf)],
  };
}

function classicOption(data: SearchResult, conf: Config) {
  return {
    ...sharedOption(conf),
    series: [
      {
        type: "funnel",
        width: conf.classicWidth,
        left: "center",
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
            itemStyle: { borderWidth: 0 },
          };
        }),
      },
    ],
  };
}

function option(data: SearchResult, conf: Config) {
  return conf.funnelType == "classic" ? classicOption(data, conf) : alternateOption(data, conf);
}
