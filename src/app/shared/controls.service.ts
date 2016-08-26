import { Injectable } from '@angular/core';
import { Router, NavigationStart} from '@angular/router';

@Injectable()
export class ControlsService {
  public controls: CustomControl[];

  constructor(private router: Router){
    router.events.subscribe((val) => {
      if(val instanceof NavigationStart)
        this.controls = [];
    })
  }

  setControls(controls : CustomControl[]){
    this.controls = controls;
  }

}

export class CustomControl{
  disabled : boolean;
  label : string;
  callback : Function;
  saveLabel : string;

  constructor(label: string, saveLabel: string, disabled : boolean, callback : Function){
    this.label = label;
    this.saveLabel = saveLabel;
    this.disabled = disabled;
    this.callback = callback;
  }

}
