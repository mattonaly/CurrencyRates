import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Table } from 'primeng/table';
import { Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';

import { Rate } from './models/Rate';
import { RatesService } from './services/rates.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  destroy$ = new Subject();

  rateItems$ = this.ratesServices.getRates$().pipe(
    takeUntil(this.destroy$),
    tap((rates) => {
      if (rates instanceof HttpErrorResponse) {
        this.handleErrorResponse(rates);
      }

      this.rates = rates;
      this.loading = false;
    })
  );

  rates: Rate[] = [];

  loading: boolean = true;

  date: Date = new Date();

  error = {
    notFound: false,
    badRequest: false,
    limitExceeded: false,
    invalidDate: false,
  };

  stateOptions = [
    { label: 'Ciemny', value: 'dark' },
    { label: 'Jasny', value: 'light' },
  ];

  darkMode: string = 'dark';

  constructor(private readonly ratesServices: RatesService) {
    this.rateItems$.subscribe();
  }

  ngOnInit(): void {
    if (
      localStorage.theme === 'dark' ||
      (!('theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      this.darkMode = 'light';
    }
  }

  clear(table: Table) {
    table.clear();
  }

  onCalendarChange(event: any) {
    this.resetErrors();

    if (event > new Date()) {
      this.error.invalidDate = true;
      return;
    }

    this.loading = true;

    this.ratesServices.getRatesOnDay$(this.date).subscribe(
      (rates) => {
        this.rates = rates;
        this.loading = false;
      },
      (error) => {
        this.rates = [];
        this.loading = false;

        this.handleErrorResponse(error);
      }
    );
  }

  onThemeChange(event: any) {
    if (event.value === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  }

  resetErrors(): void {
    if (
      this.error.notFound ||
      this.error.badRequest ||
      this.error.limitExceeded ||
      this.error.invalidDate
    ) {
      this.error.notFound = false;
      this.error.badRequest = false;
      this.error.limitExceeded = false;
      this.error.invalidDate = false;
    }
  }

  handleErrorResponse(error: HttpErrorResponse): void {
    if (error.status === 404) {
      this.error.notFound = true;
    }

    if (
      error.status === 400 &&
      error.error.message === 'Bad Request - Limit exceeded'
    ) {
      this.error.limitExceeded = true;
      return;
    }

    if (error.status === 400) {
      this.error.badRequest = true;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
