import { Rate } from './../models/Rate';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class RatesService {
  constructor(private readonly httpClient: HttpClient) {}

  getRates$(): Observable<Rate[]> {
    return this.getData$(
      'https://api.nbp.pl/api/exchangerates/tables/a/?format=json'
    ).pipe(
      map((res) => res[0].rates),
      catchError((err) => {
        return of(err);
      })
    );
  }

  getRatesOnDay$(date: Date): Observable<Rate[]> {
    function formatDate(date: Date) {
      var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

      if (month.length < 2) month = `0${month}`;
      if (day.length < 2) day = `0${day}`;

      return [year, month, day].join('-');
    }

    return this.getData$(
      `https://api.nbp.pl/api/exchangerates/tables/a/${formatDate(
        date
      )}/?format=json`
    ).pipe(map((res) => res[0].rates));
  }

  getData$(path: string): Observable<any> {
    return this.httpClient.get(path);
  }
}
