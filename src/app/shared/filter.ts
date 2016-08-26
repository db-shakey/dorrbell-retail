
import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'filter', pure : false})
export class Filter implements PipeTransform {

    transform(input:any, args?): any{

      let [filterName, filterFamily, filterStatus] = args;
      if(input){
        return input.filter(product =>{
          if(filterName && filterFamily && product.Name.indexOf(filterName) >= 0 && product.Family.indexOf(filterFamily) >= 0){
            return true;
          }else if(filterName && !filterFamily && product.Name.indexOf(filterName) >= 0){
            return true;
          }else if(filterFamily && !filterName && product.Family.indexOf(filterFamily) >= 0){
            return true;
          }else if(!filterFamily && !filterName){
            return true;
          }else{
            return false;
          }
        })
      }
    }
}
