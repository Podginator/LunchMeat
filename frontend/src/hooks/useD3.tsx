import React from 'react';
import * as d3 from 'd3';
import { BaseType } from 'typescript';

export const useD3 = (renderChartFn: (arg: any) => void, dependencies: any) => {
    const ref = React.useRef();

    React.useEffect(() => {
        renderChartFn(d3.select(ref.current as any));
        return () => {};
      }, dependencies);
    return ref;
}