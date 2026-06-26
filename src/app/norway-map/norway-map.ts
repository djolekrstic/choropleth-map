// norway-map.component.ts
import { Component, OnInit, ElementRef, ViewChild, Input } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-norway-map',
  templateUrl: 'norway-map.html',
  styleUrls: ['norway-map.css'],
})
export class NorwayMapComponent implements OnInit {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  @Input() data: Record<string, number> = {};

  private width = 1920;
  private height = 900;

  tooltip = { visible: false, x: 0, y: 0, name: '', value: '' };

  ngOnInit(): void {
    this.drawMap();
  }

  private drawMap(): void {
    d3.select(this.mapContainer.nativeElement).selectAll('svg').remove();

    const width = this.width;
    const height = this.height;

    const svg = d3
      .select(this.mapContainer.nativeElement)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', width)
      .attr('height', height)
      .attr('style', 'max-width: 100%; height: auto;');

    const projection = d3.geoIdentity().reflectY(true);
    const path = d3.geoPath().projection(projection);

    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([1, 8]).on('zoom', zoomed);

    function zoomed(event: any) {
      const { transform } = event;
      g.attr('transform', transform as any);
      g.attr('stroke-width', 1 / transform.k);
    }

    function reset() {
      svg
        .transition()
        .duration(750)
        .call(
          zoom.transform as any,
          d3.zoomIdentity,
          d3.zoomTransform(svg.node() as any).invert([width / 2, height / 2]) as any,
        );
    }

    function clicked(event: any, d: any) {
      const [[x0, y0], [x1, y1]] = path.bounds(d);
      event.stopPropagation();
      svg
        .transition()
        .duration(750)
        .call(
          zoom.transform as any,
          d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
            .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
          d3.pointer(event, svg.node()) as any,
        );
    }

    svg.on('click', reset);
    svg.call(zoom);

    d3.json<any>('/norway-regions.geojson').then((geojson) => {
      const featureCollection = { type: 'FeatureCollection', features: geojson.features };
      projection.fitSize([width, height], featureCollection as any);

      const states = g
        .append('g')
        .attr('cursor', 'pointer')
        .selectAll('path')
        .data(geojson.features)
        .join('path')
        .attr('fill', '#00205B')
        .attr('d', path as any)
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .on('click', clicked)
        .on('mousemove', (event, d: any) => this.showTooltip(event, d))
        .on('mouseleave', () => this.hideTooltip());

      states.append('title').text((d: any) => d.properties.name);

      // Region name labels
      g.append('g')
        .attr('pointer-events', 'none')
        .selectAll('text')
        .data(geojson.features)
        .join('text')
        .attr('transform', (d: any) => `translate(${path.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('fill', '#BA0C2F')
        .text((d: any) => d.properties.name);
    });
  }

  private showTooltip(event: MouseEvent, d: any): void {
    this.tooltip = {
      visible: true,
      x: event.offsetX + 12,
      y: event.offsetY - 28,
      name: d.properties.name,
      value: this.data[d.properties.name]?.toString() ?? 'N/A',
    };
  }

  private hideTooltip(): void {
    this.tooltip.visible = false;
  }
}
