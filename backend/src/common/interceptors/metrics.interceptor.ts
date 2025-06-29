import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../../metrics/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    const method = request.method;
    const route = this.getRoute(request);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = (Date.now() - startTime) / 1000; // Convertir a segundos
          const statusCode = response.statusCode.toString();
          
          // Registrar la métrica HTTP
          this.metricsService.recordHttpRequest(method, route, statusCode, duration);
        },
        error: (error) => {
          const duration = (Date.now() - startTime) / 1000;
          const statusCode = error.status?.toString() || '500';
          
          // Registrar la métrica HTTP para errores también
          this.metricsService.recordHttpRequest(method, route, statusCode, duration);
        },
      }),
    );
  }

  private getRoute(request: any): string {
    // Intentar obtener la ruta desde diferentes fuentes
    if (request.route?.path) {
      return request.route.path;
    }
    
    if (request.url) {
      // Limpiar parámetros de query para agrupar rutas similares
      const url = request.url.split('?')[0];
      
      // Reemplazar IDs numéricos con placeholder para agrupar métricas
      return url.replace(/\/\d+/g, '/:id');
    }
    
    return 'unknown';
  }
} 