import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Profile } from '../profile/profile';
import { NotificationCenter } from '../notification-center/notification-center';

@Component({
  selector: 'app-header',
  imports: [MatToolbarModule, MatIconModule, MatButtonModule, Profile, NotificationCenter],
  templateUrl: './header.html',
})
export class Header {}
