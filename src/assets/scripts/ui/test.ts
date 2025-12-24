function createChart() {
  $('#chart').kendoChart({
    title: {
      text: 'Site Visitors Stats'
    },
    subtitle: {
      text: '/thousands/'
    },
    legend: {
      visible: false
    },
    seriesDefaults: {
      type: 'bar'
    },
    series: [
      {
        name: 'Total Visits',
        data: [56000, 63000, 74000, 91000, 117000, 138000]
      },
      {name: 'Unique visitors', data: [52000, 34000, 23000, 48000, 67000, 83000]}
    ],
    valueAxis: {
      max: 140000,
      line: {
        visible: false
      },
      minorGridLines: {
        visible: true
      },
      labels: {
        rotation: 'auto'
      }
    },
    categoryAxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      majorGridLines: {
        visible: false
      }
    },
    tooltip: {
      visible: true,
      template: '#= series.name #: #= value #'
    }
  });
}

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

  // Templated Button
  if ($('#templatedButtonContainer').length) {
    const buttonTemplate = kendo.template(
      `<button id='#= id #' type='button' class='k-button k-button-lg'><span class='k-icon k-i-#= icon #'></span> #: text #</button>`
    );
    const buttonData = {
      id: 'myTemplatedButton',
      text: 'Templated Button',
      icon: 'save'
    };

    $('#templatedButtonContainer').html(buttonTemplate(buttonData));
    $('#myTemplatedButton').kendoButton({
      click: () => {
        alert('Templated button clicked!');
      }
    });
  }

  // Kendo UI RadioButtons are typically styled via CSS classes ('k-radio', 'k-radio-label')

  if ($('#engine1').length) {
    // Add existence check for radio buttons
    $('#engine1').kendoRadioButton({
      label: `<span class="k-radio-label-text">1.4 Petrol, 92kW</span><span class="k-radio-label-description">A útis consummationem.</span>`,
      checked: true,
      encoded: false
    });
    $('#engine2').kendoRadioButton({
      label: '1.8 Petrol, 118kW'
    });
    $('#engine3').kendoRadioButton({
      label: '2.0 Petrol, 147kW',
      enabled: false
    });
  }

  if ($('#radiogroup').length) {
    // Add existence check for radio group
    const radioItems = [
      {
        label: 'Phone (SMS)',
        value: 'phone',
        description: 'Receive notifications via SMS'
      },
      {
        label: 'E-mail',
        value: 'email',
        description: 'Receive notifications via E-mail'
      },
      {
        label: 'None',
        value: 'none',
        description: 'Do not receive any notifications'
      }
    ];

    const radioTemplate = kendo.template(`
      <li>
        <input type="radio" name="notification" id="radio-#: value #" class="k-radio" value="#: value #" />
        <label for="radio-#: value #" class="k-radio-label">
          <span class="k-radio-label-text">#: label #</span>
          <span class="k-radio-label-description">#: description #</span>
        </label>
      </li>
    `);

    const radioGroupElement = $('#radiogroup');
    radioItems.forEach((item) => {
      radioGroupElement.append(radioTemplate(item));
    });

    radioGroupElement.kendoRadioGroup({
      layout: 'horizontal',
      value: 'phone'
    });
  }

  createChart();
});

$(document).bind('kendo:skinChange', createChart);
