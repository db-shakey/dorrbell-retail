import { Component, OnInit, ElementRef, AfterContentInit, Input, Output, QueryList, Directive, ViewChild, AfterViewInit, Renderer, EventEmitter } from '@angular/core';
import { AngularFire, FirebaseListObservable } from 'angularfire2';
import { OrderBy } from "../shared/orderBy";
import { Filter } from "../shared/filter";
import { UserService } from '../shared/user.service';
import { HerokuService } from '../shared/heroku.service';
import { ControlsService, CustomControl} from '../shared/controls.service';
import MaskedInput from 'angular2-text-mask/dist/angular2TextMask';
import createNumberMask from 'text-mask-addons/dist/createNumberMask';

declare var $: any;
declare var Materialize: any;

@Component({
  selector: 'app-products',
  templateUrl: 'products.component.html',
  styleUrls: ['products.component.scss'],
  pipes : [OrderBy, Filter]
})
export class ProductsComponent implements OnInit, AfterViewInit {
  @ViewChild('collapsible') collapsibleElement : ElementRef;
  @ViewChild('sortSelect') sortElement : ElementRef;
  @ViewChild('itemCount') countElement : ElementRef;

  items: FirebaseListObservable<any[]>;
  itemCount: number;
  sort : String = 'Name';
  direction : String = '+';
  filterName : String = null;
  filterFamily : String = null;
  start : number = 0;
  end : number = 10;
  limit : number = 10;
  pageArray : number[];
  currentPage : number = 1;
  selectedProduct: string;
  previousProduct: string;
  cache : any = {};
  changedVariants: any = {};

  constructor(private el: ElementRef, private af: AngularFire, private userService: UserService, private renderer: Renderer, private controlsService: ControlsService, private herokuSerivce: HerokuService) {}

  doSave(){
    this.herokuSerivce.post('/retail/variants', this.changedVariants).subscribe(res => {
      this.changedVariants = {};
      this.controlsService.controls[0].disabled = true;
      Materialize.toast('Your changes have been saved', 2000);
    },
    err => {
      Materialize.toast('Unable to save changes', 2000, 'red');
    });
  }

  toggleDirection(sort: String){
    this.direction = (this.direction == '-') ? '+' : '-';
    this.sort = sort;
  }

  selectRow(id, event){
    event.preventDefault();
    event.stopPropagation();
    this.previousProduct = this.selectedProduct;
    this.selectedProduct = id;
  }

  renderRow(event){
    this.cache[this.selectedProduct] = event;
    $(this.collapsibleElement.nativeElement).collapsible();
    this.previousProduct = null;
  }

  changed(evt){
    this.changedVariants[evt.Id] = evt;
    this.controlsService.controls[0].disabled = false;
  }

  ngOnInit() {
    this.controlsService.setControls([
      new CustomControl('Save', 'Saving...', true, this.doSave.bind(this))
    ]);

    this.userService.getUser().subscribe(user => {
      this.items = this.af.database.list('retailers/' + user.contact.Store__c + '/products',
        {
          query : {
            orderByChild : 'RecordType/DeveloperName',
            equalTo : 'Product'
          }
        }
      )
      let once = this.items.subscribe(
        snapshots => {
          this.itemCount = snapshots.length;
          let count:number = Math.ceil(snapshots.length / +this.limit);
          this.pageArray = Array(count).fill(count).map((x, i)=>i+1);
          once.unsubscribe();
        },
        err => {
          this.items = null;
        }
      );
    });
  }

  goToPage(page:number){
    if(page > 0 && page <= this.pageArray.length){
      this.currentPage = page;
      this.start = (page - 1) * (this.limit + 1);
      this.end = this.start + this.limit;
    }
  }

  ngAfterViewInit(){
    $(this.sortElement.nativeElement).material_select();
    $(this.countElement.nativeElement).material_select();
    $(this.sortElement.nativeElement).on('change', (evt) => {
      this.toggleDirection(evt.target.value);
    });
    $(this.countElement.nativeElement).on('change', (evt) => {
      this.limit = Number(evt.target.value);
      this.end = this.start + this.limit;
      let count:number = Math.ceil(this.itemCount / +this.limit);
      this.pageArray = Array(count).fill(count).map((x, i)=>i+1);
    });
  }
}



@Component({
  selector : '.variant-row',
  templateUrl : 'variantlist.component.html',
  styleUrls: ['variantlist.component.scss'],
  directives: [MaskedInput]
})
export class VariantList implements OnInit{
  items: FirebaseListObservable<any[]>;
  @Input() cache : any;
  @Input() productId: string;
  @Output() onloaded = new EventEmitter();
  @Output() changed = new EventEmitter<any>();

  public currencyMask;
  public numberMask;
  private valid: boolean = false;

  constructor(private af: AngularFire, private userService: UserService) {
    this.currencyMask = {
      mask : createNumberMask({
        allowDecimal : true,
        prefix: ''
      }),
      onAccept : () => {
        this.valid = true;
      }
    };
    this.numberMask = {
      mask : createNumberMask({
        prefix : ''
      }),
      onAccept : () => {
          this.valid = true;
      }
    }
  }

  ngOnInit(){
    if(!this.cache)
      this.queryData();
    else
      setTimeout(() => this.onLoad(), 1);
  }

  queryData(){
    this.userService.getUser().subscribe(user => {
      this.af.database.list('retailers/' + user.contact.Store__c + '/products',
        {
          preserveSnapshot : true,
          query : {
            orderByChild : 'Parent_Product__c',
            equalTo : this.productId
          }
        }
      ).subscribe(snapshot => {
        let index: number = 0;
        this.cache = [];
        snapshot.forEach(s => {
          this.cache[index] = s.val();
          this.defaultValue(this.cache[index], 'Inventory_Quantity__c', false);
          this.defaultValue(this.cache[index].PricebookEntries.records[0], 'UnitPrice', true);
          this.defaultValue(this.cache[index].PricebookEntries.records[0], 'Display_Price__c', true);
          index++;
        });
        setTimeout(() => this.onLoad(), 1);
      }, err => {
        console.log(err);
      });
    });
  }

  onChange(variant){
    if(this.valid)
      this.changed.emit(variant)

    this.valid = false;
  }

  defaultValue(obj, prop, includeDecimals: boolean){
    if(!obj[prop] || String(obj[prop]).trim().length == 0){
      obj[prop] = "0";
    }
  }

  highlight(event:any){
    event.srcElement.setSelectionRange(0, event.srcElement.value.length);
  }
  onLoad(){
    this.onloaded.emit(this.cache);
  }

}
