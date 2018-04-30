const API_ROUTES = [
    ...require("./file/routes/file.routes"),
    ...require("./image/routes/image.routes"),
    ...require("./organization/routes/organization.routes"),

    ...require("./property/building/routes/building.routes"),
    ...require("./property/device/routes/device.routes"),
    ...require("./property/device/routes/equipment.routes"),
    ...require("./property/floor/routes/floor.routes"),
    ...require("./property/inspection/routes/inspection.routes"),
    ...require("./property/property/routes/property.routes"),
    ...require("./property/property/routes/construction-type.routes"),
    ...require("./property/property/routes/occupancy-type.routes"),

    ...require("./service/routes/service.routes"),
    ...require("./user/routes/user.routes"),
    ...require("./user/routes/password.routes"),
];

module.exports = API_ROUTES;
