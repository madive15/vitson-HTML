$(document).ready(function () {
  // Initialize Kendo Buttons
  if ($('#kendoButton').length) {
    $('#kendoButton').kendoButton({themeColor: 'primary', enable: true});
    $('#kendoPrimaryButton').kendoButton({
      icon: 'filter',
      size: 'large',
      click: (e) => {
        console.log(e);
      }
    });
    $('#kendoLargeButton').kendoButton({
      rounded: 'full', // none | small | medium | large | full
      fillMode: 'solid', // solid | outline | flat | link
      themeColor: 'primary' // base | primary | secondary | success | etc
    });
    $('#customSizedButton').kendoButton({size: 'small'});
  }
  // Kendo UI RadioButtons are typically styled via CSS classes ('k-radio', 'k-radio-label')

  $('#engine1').kendoRadioButton({
    label: '1.4 Petrol, 92kW',
    checked: true
  });
  $('#engine2').kendoRadioButton({
    label: '1.8 Petrol, 118kW'
  });
  $('#engine3').kendoRadioButton({
    label: '2.0 Petrol, 147kW',
    enabled: false
  });
  $('#radiogroup').kendoRadioGroup({
    items: [
      {
        label: 'Phone (SMS)',
        value: 'Phone (SMS)'
      },
      {
        label: 'E-mail',
        value: 'E-mail'
      },
      {
        label: 'None',
        value: 'None'
      }
    ],
    layout: 'horizontal', // horizontal | vertical
    value: 'Phone (SMS)'
  });
});
