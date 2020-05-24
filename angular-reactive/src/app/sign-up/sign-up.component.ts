import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidatorFn } from '@angular/forms'
import { Person } from './person';
import { debounceTime } from 'rxjs/operators';

// custom validators
function ageRange(minAge: number): ValidatorFn {
  return (c: AbstractControl): { [key: string]: boolean } | null => {
    if (c.value !== null && (isNaN(c.value) || c.value < minAge)) {
      return { 'range': true }
    }

    return null;
  }
}

function compareEmails(c: AbstractControl): { [key: string]: boolean } | null {
  const email = c.get('email');
  const confirmEmail = c.get('confirmEmail');
  if (email.pristine || confirmEmail.pristine) {
    return null;
  }

  if (email.value !== confirmEmail.value) {
    return { 'match': true };
  }

  return null;
}

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})
export class SignUpComponent implements OnInit {
  infoForm: FormGroup;
  person = new Person();
  validationMessage = {
    firstName: '',
    lastName: '',
    email: '',
    confirmEmail: '',
    emailGroup: '',
    age: '',
  };

  private validationMessages = {
    firstName: {
      required: 'First name is required',
      minlength: 'First name must be more than 3 characters'
    },
    lastName: {
      required: 'Last name is required',
      minlength: 'Last name must be more than 3 characters'
    },
    email: {
      required: 'Email is required',
      email: 'Emails is invalid'
    },
    confirmEmail: {
      required: 'Confirmation email is required'
    },
    age: {
      range: 'Age must be above 18'
    },
    emailGroup: {
      match: 'Emails must match'
    }
  }

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    this.infoForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.minLength(3)]],
      age: 0,
      isRequired: 'false',
      emailGroup: this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        confirmEmail: ['', [Validators.required,]]
      }, { validator: compareEmails }),
    });

    // watchers
    this.infoForm.get('isRequired').valueChanges.subscribe(value => this.setRequired(value));

    const formProperties = this.infoForm.value;

    for (const property in formProperties) {
      if (property === 'emailGroup') {
        let emailControl = this.infoForm.get('emailGroup.email');
        let emailGroup = this.infoForm.get('emailGroup');
        let confirmEmailControl = this.infoForm.get('emailGroup.confirmEmail');
        emailControl.valueChanges.pipe(debounceTime(1000)).subscribe(value => this.setValidation(emailControl));
        confirmEmailControl.valueChanges.pipe(debounceTime(1000)).subscribe(value => this.setValidation(confirmEmailControl));
        emailGroup.valueChanges.pipe(debounceTime(1000)).subscribe(value => this.setValidation(emailGroup));
      } else {
        let control = this.infoForm.get(property);
        control.valueChanges.pipe(debounceTime(1000)).subscribe(value => this.setValidation(control));
      }
    }
  }

  populateData() {
    this.infoForm.setValue({
      firstName: 'Atanas',
      lastName: 'Kolev',
      age: 20,
      isRequired: 'false',
      emailGroup: {
        email: 'naskokolev@gmail.com',
        confirmEmail: 'naskokolev@gmail.com'
      }
    });
  }

  clearData() {
    this.infoForm.setValue({
      firstName: '',
      lastName: '',
      age: 0,
      isRequired: '',
      emailGroup: {
        email: '',
        confirmEmail: ''
      }
    });
  }

  // put a validator based on some user things ( click, select etc.. )
  setRequired(value: string) {
    const ageControl = this.infoForm.get('age');
    if (value === 'true') {
      ageControl.setValidators(ageRange(18));
    } else {
      ageControl.clearValidators();
    }

    ageControl.updateValueAndValidity();
  }

  getControlName(c: AbstractControl): string | null {
    const formGroup = c.parent.controls;
    return Object.keys(formGroup).find(name => c === formGroup[name]) || null;
  }

  setValidation(c: AbstractControl) {
    const controlName = this.getControlName(c);
    this.validationMessage[controlName] = '';

    if ((c.touched || c.dirty) && c.errors) {
      this.validationMessage[controlName] = Object.keys(c.errors).map(key => this.validationMessages[controlName][key]).join(' ');
    }
  }

  save() {
    // executed on form submit...
    // maybe here attach the properties to Person
  }
}
