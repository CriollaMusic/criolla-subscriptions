import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranslateService {
  static tags: any = {};
  languageChange: BehaviorSubject<string> = new BehaviorSubject<string>('es');
  languageLoaded: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  currentLanguage: string = '';

  constructor(private http: HttpClient) {
    this.languageChange.subscribe(res => {
      if (res != this.currentLanguage) {
        this.currentLanguage = res;
        this.loadLangualge();
      }
    });
  }

  loadLangualge() {
    // Cache-bust so newly added translation keys are always picked up.
    let url = `assets/lang/${this.currentLanguage}.json?v=${Date.now()}`;
    this.http.get(url).subscribe(res => {
      TranslateService.tags = res;
      this.languageLoaded.next(true);
    });
  }

  getText(id: string): string {
    let content = TranslateService.tags[id];
    return content ? content : id;
  }

}
