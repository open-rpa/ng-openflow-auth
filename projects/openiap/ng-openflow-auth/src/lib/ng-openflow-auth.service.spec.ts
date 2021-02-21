import { TestBed } from '@angular/core/testing';

import { NgOpenflowAuthService } from './ng-openflow-auth.service';

describe('NgOpenflowAuthService', () => {
  let service: NgOpenflowAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgOpenflowAuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
