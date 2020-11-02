function setupExportModal(bindingContext, params = {}) {
    const {title, dates, entities} = params;
    const source = params.source || {};

    function onChangeBuilder(value) {
        return function (bindings, event) {
            const newValue = event.target && event.target && event.target.value;
            value(newValue);
        }
    }

    const datesSelector = (function () {
        const list = dates || (function () {
            const last = moment().subtract(5, 'years').format('YYYY-MM-DD');
            const annual = moment().subtract(1, 'years').format('YYYY-MM-DD');
            const quarter = moment().subtract(3, 'months').format('YYYY-MM-DD');
            const week = moment().subtract(1, 'week').format('YYYY-MM-DD');

            return [
                ['All', null],
                ['Last year', annual],
                ['Last quarter', quarter],
                ['Last week', week],
            ].map(([title, from]) => ({title, from}));
        })();

        const defaultValue = list[0] && list[0].from;
        const value = ko.observable(defaultValue);
        const onChange = onChangeBuilder(value);

        return {value, onChange, list};
    })();

    const entitiesSelector = (function () {
        const list = (entities || [
            ['Inspections', 'inspections'],
            ['Devices', 'devices'],
            ['Floors', 'floors'],
            ['Buildings', 'buildings'],
            ['Properties', 'properties'],
        ]).map(([title, route], i) => ({title, route}));

        const defaultValue = list[0] && list[0].route;
        const value = ko.observable(defaultValue);
        const onChange = onChangeBuilder(value);

        return {value, onChange, list};
    })();

    const exportModal = {
        templateUrl: '/admin/parts/export/modal.html',
        title: title,
        exportCsv: function () {
            const user = (localStorage.getItem('user')) ? JSON.parse(localStorage.getItem('user')) : null;
            const route = entitiesSelector.value();
            // source === {BuildingID : <value>}
            const queryParams = Object.keys(source)
                .map(fieldName => `&${fieldName}=${source[fieldName]}`).join('');

            const from = datesSelector.value();
            const fromParams = from ? `&from=${from}` : ``;

            const fileNameParams = Object.keys(source)
                .map(fieldName => `_${fieldName}_${source[fieldName]}`).join('');

            const filename = `${route}${fileNameParams}${from ? `_from_${from}`: ''}.csv`;

            const url = `${Site.APIURL}/${route}/export-csv?hash=${user._id}${queryParams}${fromParams}&filename=${filename}`;
            console.log(`url == ${url}`);
            window.open(url);
        },

        dates: datesSelector,
        entities: entitiesSelector
    };

    bindingContext.exportModal = exportModal;

    return exportModal;
}
