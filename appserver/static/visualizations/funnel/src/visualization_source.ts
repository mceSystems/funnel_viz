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
      this.chunk = 1000;
      this.offset = 0;
      SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
      this.el.classList.add("vizviz-calendar-container");
    },

    // @ts-expect-error
    formatData: function (data) {
      // if (data.fields.length == 0) {
      //   return data;
      // }

      //// @ts-expect-error
      // if (!data.fields.some((x) => x.name === "_time")) {
      //   throw new SplunkVisualizationBase.VisualizationError(
      //     "Unsupported data format: This visualization needs _time field."
      //   );
      // }

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
        count: 1000,
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
  funnelStyle: "classic" | "alternative";
  radius: number;
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
    this.funnelStyle = c[`${this.#vizNamespace}.funnelStyle`] === "classic" ? "classic" : "alternative";
    this.radius = this.validateRadius(c[`${this.#vizNamespace}.radius`]);
    this.colors = c;
  }

  sanitizeItem(s: string): number | "" {
    return !Number.isNaN(parseInt(s)) ? parseInt(s) : "";
  }

  validateRadius(rad: string): number {
    const d = this.sanitizeItem(rad);
    return d === "" ? 50 : d;
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
}

function bar(result: Result) {
  return {
    type: "bar",
    silent: true,
    zlevel: 1,
    colorBy: "data",
    barCategoryGap: "20%",
    barWidth: 96,
    label: {
      position: "insideLeft",
      show: true,
      align: "left",
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

function graph(result: Result, colors: string[]) {
  const links = [];

  for (let i = 0; i < result.length - 1; i++) {
    links.push({ source: i, target: i + 1 });
  }

  return {
    type: "graph",
    coordinateSystem: "cartesian2d",
    xAxisIndex: 1,
    yAxisIndex: 1,
    symbolSize: 96,
    silent: true,
    lineStyle: {
      width: 16,
      color: "#ddd",
    },
    data: result.map((x, i) => {
      return {
        value: 0,
        label: { formatter: x, show: true, fontSize: 14, fontWeight: 700 },
        itemStyle: { color: colors[i % colors.length] },
      };
    }),
    links: links,
  };
}

function option(data: SearchResult, conf: Config) {
  // const fields = data.fields.map((x) => x.name);

  return {
    toolbox: {
      feature: {
        saveAsImage: {
          backgroundColor: conf.background,
          name: "calendar-chart",
        },
      },
    },
    color: conf.colors,
    backgroundColor: "transparent",
    grid: [
      {
        left: "96px",
        right: "32px",
        bottom: "32px",
        containLabel: true,
      },
      {
        left: "32px",
        right: "32px",
        bottom: "32px",
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
        data: data.columns[0],
      },
      {
        type: "category",
        gridIndex: 1,
        show: false,
        data: data.columns[0],
      },
    ],
    series: [bar(data.columns[1]), area(data.columns[1]), graph(data.columns[2], conf.colors)],
  };
}
