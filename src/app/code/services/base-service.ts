import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseEntity } from "../models/shared/BaseEntity";

export class BaseService<T>{

  apiUrl: string;
  constructor(public client: HttpClient, address: string, endpoint: string) {
    this.apiUrl = `${address}${endpoint}`;
  }

  get(): Observable<Array<T>> {
    return this.client.get<Array<T>>(`${this.apiUrl}/all`);
  }

  getById(id: number): Observable<T> {
    return this.client.get<T>(`${this.apiUrl}/byId/${id}`);
  }

  new(item: T, id: number = 0): Observable<T> {
    return this.client.post<T>(`${this.apiUrl}/add${id > 0 ? '/' + id : ''}`, item);
  }

  edit(item: T, id: number): Observable<BaseEntity> {
    return this.client.put<BaseEntity>(`${this.apiUrl}/update/${id}`, item);
  }

  delete(id: number): Observable<BaseEntity> {
    return this.client.delete<BaseEntity>(`${this.apiUrl}/${id}`);
  }

}
