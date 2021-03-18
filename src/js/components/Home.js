import {templates} from './../settings.js';


class Home {
  constructor(wrapper){

    const thisHome = this;

    thisHome.render();
    thisHome.initWidgets();
  }

  render(wrapper){
    const thisHome = this;

    const generatedHTML = templates.homeWidget();

    thisHome.dom = {};
    thisHome.dom.wrapper = wrapper;
    thisHome.dom.wrapper.innerHTML = generatedHTML;
  }

  initWidgets(){
    const thisHome = this;

    thisHome.element = document.querySelector('.carousel-section');
    thisHome.flkty = new Flickity (thisHome.element,{
      cellAlign: 'left',
      contain: true,
      autoplay: true,
      wrapAround: true,
    });
  }
}

export default Home;
