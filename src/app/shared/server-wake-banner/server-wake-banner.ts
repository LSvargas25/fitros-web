import { Component, inject } from '@angular/core';

import { ServerWakeService } from '../../core/http/server-wake.service';

@Component({
  selector: 'app-server-wake-banner',
  standalone: true,
  templateUrl: './server-wake-banner.html',
})
export class ServerWakeBanner {
  readonly waking = inject(ServerWakeService).waking;
}
