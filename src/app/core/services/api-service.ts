import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  readonly baseUrl = "https://emailmanager-production-c04a.up.railway.app"
  private apiUrl = this.baseUrl;
  private http: HttpClient = inject(HttpClient);

  public get<T>(path: string, options?: Parameters<HttpClient['get']>[1]): Observable<T> {
    return this.http.get<T>(this.formatPath(path), options);
  }

  public put<T>(path: string, body: unknown, options?: Parameters<HttpClient['put']>[2]): Observable<T> {
    return this.http.put<T>(this.formatPath(path), body, options);
  }

  public post<T>(path: string, body: unknown, options?: Parameters<HttpClient['post']>[2]): Observable<T> {
    return this.http.post<T>(this.formatPath(path), body, options);
  }

  public delete<T>(path: string, options?: Parameters<HttpClient['delete']>[1]): Observable<T> {
    return this.http.delete<T>(this.formatPath(path), options);
  }

  public head(path: string, options?: Parameters<HttpClient['head']>[1]): Observable<HttpResponse<never>> {    
    return this.http.head<never>(this.formatPath(path), { 
      ...options, 
      observe: 'response' 
    });
  }

  private formatPath(path: string): string {
    return path.startsWith('/') ? this.apiUrl + path : `${this.apiUrl}/${path}`
  }
}
