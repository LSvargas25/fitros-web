import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar implements OnInit {

  title = '';
  searchTerm = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        let current = this.route;
        while (current.firstChild) {
          current = current.firstChild;
        }
        this.title = current.snapshot.data['title'] || '';
      });
  }

  onLogout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  onSearch(): void {
    console.log(this.searchTerm);
  }
}
