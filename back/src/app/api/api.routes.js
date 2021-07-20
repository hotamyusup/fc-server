const API_ROUTES = [
    ...require("./internal-inventory/routes/internal-inventory.routes"),

    ...require("./document/common/routes/document.routes"),
    ...require("./document/fire-safety/routes/fire-safety.document.routes"),
    ...require("./document/upload/routes/upload.document.routes"),

    ...require("./file/routes/file.routes"),
    ...require("./geocoder/routes/geocoder.routes"),
    ...require("./image/routes/image.routes"),
    ...require("./video/routes/video.routes"),
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
    ...require("./notification/routes/notification.routes"),
];

module.exports = API_ROUTES;
