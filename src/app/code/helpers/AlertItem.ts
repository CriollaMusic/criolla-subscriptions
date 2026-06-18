import Swal from 'sweetalert2'

export class AlertItem{
    title!: string;
    html!: string;
    type!: string;
    showCloseButton!: boolean;
    showCancelButton!: boolean;
    focusConfirm!: boolean;
    text!: string;
    timer!: number;
    position!: string;
    confirmButtonText!: string;
    confirmButtonAriaLabel!: string;
    cancelButtonText!: string;
    cancelButtonAriaLabel!: string;

    Show():Promise<any>{
        return Swal.fire({
            text:this.text,
            title: this.title,
            icon: this.type == 'info'? 'info': this.type == 'success'? 'success' : this.type == 'warning'? 'warning':'error' ,
            html: this.html,
            showCloseButton: this.showCloseButton,
            focusConfirm: this.focusConfirm,
            timer:this.timer,
            position: this.position ==  'top-left' ? 'top-left' : this.position ==  'top-rigth' ? 'top-right' : 'center'
          });
    }

    Confirm():Promise<any>{
      return Swal.fire({
        title: this.text,
        icon: this.type == 'info'? 'info': this.type == 'success'? 'success' : this.type == 'warning'? 'warning':'error' ,
        html: this.html,
        showCloseButton: this.showCloseButton,
        showCancelButton: this.showCancelButton,
        focusConfirm: this.focusConfirm,
        confirmButtonText:this.confirmButtonText,
        confirmButtonAriaLabel: this.confirmButtonAriaLabel,
        cancelButtonText:this.cancelButtonText,
        cancelButtonAriaLabel: this.cancelButtonAriaLabel
      })
    }

}
