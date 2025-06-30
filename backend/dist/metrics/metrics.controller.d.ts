import { MetricsService } from './metrics.service';
import { DatasetsService } from '../datasets/datasets.service';
export declare class MetricsController {
    private readonly metricsService;
    private readonly datasetsService;
    constructor(metricsService: MetricsService, datasetsService: DatasetsService);
    getMetrics(): Promise<string>;
    getHealth(): {
        status: string;
        timestamp: string;
        metrics_count: number;
        uptime: number;
    };
    updateDatasetMetrics(): Promise<any>;
    updateGrowthMetrics(): Promise<any>;
    getGrowthDashboard(): Promise<any>;
}
