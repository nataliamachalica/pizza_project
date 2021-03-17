import {templates, select, settings, classNames} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking{
  constructor(element){

    const thisBooking = this;

    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();

    thisBooking.selectTable();

  }

  getData(){
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);


    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };

    //console.log('getData params:', params);

    const urls = {
      booking:        settings.db.url + '/' + settings.db.booking
                                      + '?' + params.booking.join('&'),
      eventsCurrent:  settings.db.url + '/' + settings.db.event
                                      + '?' + params.eventsCurrent.join('&'),
      eventsRepeat:   settings.db.url + '/' + settings.db.event
                                      + '?' + params.eventsRepeat.join('&'),
    };

    //console.log('getData urls:', urls);

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function(allResponses){
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){
        //console.log(bookings);
        //console.log(eventsCurrent);
        //console.log(eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;

    thisBooking.booked = {};

    for(let item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for(let item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for(let item of eventsRepeat){
      if(item.repeat == 'daily'){
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }

    //console.log('thisBooking.booked:', thisBooking.booked);

    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table){
    const thisBooking = this;

    if(typeof thisBooking.booked[date] == 'undefined'){
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
      //console.log('loop:', hourBlock);

      if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM(){
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value; //wartości wybrane przez usera
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false; // tego dnia o tej godzinie wszystkie stoliki dostępne, na razie ma wartość false

    if( //jeśli okaże się ze w obiekcie thisbooking booked dla tej daty nie ma obiektu albo dla daty i godziy nie ma tablicy, oznacza to ze zaden stolik nie jest zajęty
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ){
      allAvailable = true; //wiec all available sa dostepne = true
    }

    for(let table of thisBooking.dom.tables){ //iteruje przez wszystie stoliki
      let tableId = table.getAttribute(settings.booking.tableIdAttribute); //pobieramy id aktualnego stolika - nazwa właściwosci numerów stolików są w settings, bo to nie muszą być info html'owe
      if(!isNaN(tableId)){ //sprawdzamy czy tableId jest liczbą = będzie ona zawsze tekstem
        tableId = parseInt(tableId); // tekst może zostać przekonwertowany na liczbę, więc tableId wyświetli się (przez zanegowanie NaN)
      }

      //wyrazenie if sprawdza czy ktorys stolik jest zajety właściwie czy nie wszystkie stoliki sa dostepne
      //a jesli stolim jest zajety a jesli danego dnia o tej godzinie zajety jest stolik o takim ID
      if(
        !allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId) //includes sprawdza czy tableId znajduje się w tablicy thisBooking.booked
      ){
        table.classList.add(classNames.booking.tableBooked);
        //table.classList.remove(classNames.booking.tableClicked);
        //stolik zajety dostanie klase zapisaną w classnames booked
      } else{ // alternatywnie - jesli wszystkie stoliki sa dostepne lu  nie wszystkie sa dostepne ale ten przez ktory iterujemy nie znajduje sie w this booking booked to chcecmy usunac z niego klase table booked, ktora oznacza ze ten stolik jest zajety
        table.classList.remove(classNames.booking.tableBooked);
      }
      table.addEventListener('click', function(){
        table.classList.toggle(classNames.booking.tableBooked);
      });
    }
  }

  render(wrapper){
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();

    thisBooking.dom = {};

    thisBooking.dom.wrapper = wrapper;

    thisBooking.dom.wrapper.innerHTML = generatedHTML;

    thisBooking.dom.wrapper = document.querySelector(select.containerOf.booking);

    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);

    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);

    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    //console.log(thisBooking.dom.tables); div każdego stolika z osobna

    //thisBooking.dom.floorPlan = thisBooking.dom.wrapper.querySelector('.floor-plan');
    //console.log(thisBooking.dom.floorPlan); // div całego planu stolików
    thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(select.booking.form);
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.cart.address);
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.cart.phone);
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starters);
  }

  initWidgets(){
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.wrapper.addEventListener('updated', function(){ //event listener nasłuchuje aktualizacji daty, a kiedy ja wykryje uruchomi metode ponizej
      thisBooking.updateDOM();
    });
    thisBooking.dom.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisBooking.sendBooking();
    });
  }

  selectTable(){
    const thisBooking = this;

    for(let table of thisBooking.dom.tables){

      table.addEventListener('click', function(event){
        event.preventDefault();

        if(table.classList.contains('booked')){ //classNames.booking.tableBooked - tak było
          alert('not available');
        }else{
          thisBooking.removeSelected();
          table.classList.add(classNames.booking.tableSelected);
          const tableNumber = table.getAttribute(settings.booking.tableIdAttribute);
          thisBooking.bookedTable = parseInt(tableNumber);
        }
      });
    }
  }

  removeSelected(){
    const thisBooking = this;

    const selectedTables = document.querySelectorAll('.selected');
    for(let selected of selectedTables){
      selected.classList.remove(classNames.booking.tableSelected);
    }
    delete thisBooking.bookedTable;
  }

  sendBooking(){
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.booking;

    const payload = {
      date: thisBooking.datePicker.value,
      hour: thisBooking.hourPicker.value,
      table: thisBooking.bookedTable,
      ppl: parseInt(thisBooking.peopleAmount.value),
      duration: parseInt(thisBooking.hoursAmount.value),
      hoursAmount: thisBooking.hoursAmount.value,
      starters: [],
      address: thisBooking.dom.address.value,
      phone: thisBooking.dom.phone.value,
    };

    for(let starter of thisBooking.dom.starters){
      if(starter.checked == true){
        payload.starters.push(starter.value);
      }
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(function(response){
        return response.json();
      }).then(function(parsedResponse){
        console.log(parsedResponse);
      });
  }
}
export default Booking;
