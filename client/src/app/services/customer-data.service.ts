import { Injectable } from '@angular/core';
import { createName } from '../utils';

export interface CustomerData {
  id: string;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class CustomerDataService {
  private readonly KEY = 'customer';

  getOrCreate(): CustomerData {
    let data = sessionStorage.getItem(this.KEY);

    if (!data) {
      const customerData: CustomerData = {
        id: crypto.randomUUID(),
        name: createName(),
      };

      sessionStorage.setItem(this.KEY, JSON.stringify(customerData));
      data = JSON.stringify(customerData);
    }

    const parsed = JSON.parse(data) as CustomerData;

    console.log('Customer Data:', parsed);
    return parsed;
  }
}
