import React from 'react';
import * as d3 from 'd3';
import { useD3 } from '../../hooks/useD3';

interface PieChartProps {
    width: number,
    height: number,
    fontSize?: number,
    data: { label: string, value: number }[]

}

function PieChart(props: PieChartProps) {

  const ref = useD3(
    (svg) => {
      svg.select('*').remove();
      const radius = Math.min(props.width, props.height) / 2 - 15;

      const data = props.data;
      const colours = d3.scaleLinear().domain([0, data.length - 1])
        .range(["#2e69eb", " #ffe200"] as any)

      const g = svg
          .attr('width', props.width)
          .attr('height', props.height)
        .append('g')
          .attr('transform', `translate(${(props.width / 2) }, ${props.height / 2} )`);


        const pieGenerator = d3.pie()
          .padAngle(0)
          .value((d: any) => d.value)


        const arcGenerator = d3.arc()
          .innerRadius(0)
          .outerRadius(radius)

        const arc = g
          .selectAll()
          .remove()
          .data(pieGenerator(data as any))
          .enter();

        arc.append('path')
          .attr('d', arcGenerator)
          .attr('fill', (data.length > 1) ? (_: any, i: any) => colours(i): "#2e69eb")


          if (data.length > 2 || data.some(it => it.label.length > 10)) { 
            g.attr('transform', `translate(${(props.width / 2) + 15.2 }, ${props.height / 2} )`);

            svg
              .selectAll(".bar")
              .data(data)
              .join("rect")
              .attr("class", "bar")
              .attr("x", 0)
              .attr('fill', (data.length > 1) ? (_: any, i: any) => colours(i): "#2e69eb")
              .attr("width", 5)
              .attr("y", (d: any, idx: any) => (idx + 1) * 10)
              .attr("height", 5);

              svg
              .selectAll(".text")
              .data(data)
              .join("text")
              .attr("x", 7)
              .text((d: any) => d.label)
              .attr("font-size", 8)
              .attr('fill',"#000")
              .attr("width", 5)
              .attr("y", (d: any, idx: any) => (idx + 1) * 10 + 5)
              .attr("height", 5);
          } else { 
            arc
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'middle')
            .text((d: any) => d.data.label)
            .style('fill', '#000')
            .style('font-size', props.fontSize || 8)
            .attr('transform', (d: any) => {
              const [x, y] = arcGenerator.centroid(d);
              return `translate(${x- 4}, ${y})`;
            });
          }

          
    },
    [props.data.length]
);
  
  return (
    <svg
      ref={ref as any}
      style={{
        height: props.height,
        width: props.width,
        margin: 'auto',
        marginTop: '4px'
      }}
    >
    </svg>
  );
}

export default PieChart;

