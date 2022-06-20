import { RatesService } from './services/rates.service';
import { Rate } from './models/Rate';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Table } from 'primeng/table';
import { takeUntil, tap } from 'rxjs/operators';
import { Subject } from 'rxjs';

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

  activityValues: number[] = [0, 100];

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
    }
  }

  clear(table: Table) {
    table.clear();
  }

  onCalendarChange(event: any) {
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
    );
  }

  onThemeChange(event: any) {
    if (event.value === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.removeItem('theme');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
