import React from 'react';
import * as d3 from 'd3';
import { useD3 } from '../../hooks/useD3';

interface BarChartProps {
    width: number,
    height: number,
    data: { xAxis: string, value: number }[]
}

function BarChart(props: BarChartProps) {
    const ref = useD3(
        (svg) => {
            const height = props.height;
            const width = props.width;
            const margin = { top: 20, right: 20, bottom: 20, left: 40 };

            const x = d3
                .scaleBand()
                .domain(props.data.map((d) => d.xAxis))
                .rangeRound([margin.left, width - margin.right])
                .padding(0.2);

            const y1 = d3
                .scaleLinear()
                .domain([0, d3.max(props.data, (d: any) => d.value)])
                .rangeRound([height - margin.bottom, margin.top]);

            const xAxis = (g: any) =>
                g.attr(`transform`, `translate(0, ${height - margin.bottom})`).call(
                    d3
                        .axisBottom(x)
                        .ticks(props.data.length)
                        .tickSizeOuter(0)
                );

            const y1Axis = (g: any) =>
                g.attr(`transform`, `translate(${margin.left}, 0)`)
                    .style("color", "black")
                    .call(d3.axisLeft(y1).ticks(null, "s"))
                    .call((g: any) => g.select(".domain").remove());

            svg.select(".x-axis").call(xAxis);
            svg.select(".y-axis").call(y1Axis);

            svg
                .select(".plot-area")
                .attr("fill", "#2e69eb")
                .selectAll(".bar")
                .data(props.data)
                .join("rect")
                .attr("class", "bar")
                .attr("x", (d: any) => x(d.xAxis))
                .attr("width", x.bandwidth())
                .attr("y", (d: any) => y1(d.value))
                .attr("height", (d: any) => y1(0) - y1(d.value));
        },
        [props.data.length]
    );

    return (
        <svg
            ref={ref as any}
            style={{
                height: props.height,
                width: props.width,
                marginRight: "0px",
                marginLeft: "0px",
            }}
        >
            <g className="plot-area" />
            <g className="x-axis" />
            <g className="y-axis" />
        </svg>
    );
}

export default BarChart;