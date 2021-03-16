import BaseWidget from '../Components/BaseWidget.js';
import utils from '../utils.js';
import {select, settings} from '../settings.js';

class DatePicker extends BaseWidget{
  constructor(wrapper){
    super(wrapper, utils.dateToStr(new Date()));
    const thisWidget = this;

    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.datePicker.input);
    thisWidget.initPlugin();
  }
  initPlugin(){
    const thisWidget = this;

    thisWidget.minDate = new Date(); //(thisWidget.value)
    thisWidget.maxDate = utils.addDays(thisWidget.minDate, settings.datePicker.maxDaysInFuture);
    // eslint-disable-next-line no-undef
    flatpickr(thisWidget.dom.input, {
      defaultDate: thisWidget.minDate, //ustawia aktualną date
      minDate: thisWidget.minDate, // minimalna data = też dziś
      maxDate: thisWidget.maxDate, // maksymalna data do wyboru - wartość z settings (14 = 14 dni naprzód)
      locale: {
        firstDayOfWeek: 1 //pierwszym dniem tygodnia zawsze będzie poniedziałek
      },
      disable: [
        function(date) {
          return (date.getDay() === 1); // nieczynne w poniedziałki
        }
      ],
      onChange: function(selectedDates, dateStr) { //callback - będzie uruchamiany, gdy plugin wykryje zmianę terminu.
        thisWidget.value = dateStr; //wynikiem działania funkcji callback (onChange) jest zaktualizowanie thisWidget.value
      },
    });
  }

  //jeśli w klasie pochodnej jest taka metoda o
  //takiej samej nazwie jak w klasie bazowej,
  //to zawsze ważniejsza będzie ta, w klasie pochodnej.
  //Ustawiając wiec nasze trzy własne metody parseValue,
  //isValid i renderValue, po prostu zapewniamy sobie to,
  //że setter w BaseWidget będzie uruchamiał w
  //przypadku DatePicker właśnie je, a nie oryginały.
  //Tym samym niczego nam nie popsuje, bo te nowe wersje
  //metod są już dla nas bezpieczne.

  parseValue(value){
    return value;
  }

  isValid(){
    return true;
  }

  renderValue(){

  }
}

export default DatePicker;
