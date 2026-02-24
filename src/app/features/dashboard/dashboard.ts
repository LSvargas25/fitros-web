import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-950 p-8 text-white">
      <h1 class="text-3xl font-bold">Dashboard</h1>
      <p class="mt-2 text-slate-400">Login successful 🎉</p>
    </div>
  `
})
export class Dashboard {}
