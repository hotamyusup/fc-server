var User;
//var Config = { APIURL: "http://firecloud3.fireprotected.com", BaseURL: "http://firecloud3.fireprotected.com/admin" }
var Config = { APIURL: "http://dev.fc2.fireprotected.com:9999", BaseURL: "http://dev.fc2.fireprotected.com:9999/admin" }
// var Config = { APIURL: "http://192.168.1.30:8080", BaseURL: "http://192.168.1.30:8080/admin" }

$(function () {
	Site = {
	    APIURL: Config.APIURL,
		init: function (userTypesAccessList) {

            function setupHtmlUrlHandler() {
                const markupLoader = {
                    templateDictionary: {},
                    loadMarkup: function (element, value, bindingContext) {
                        if (!this.templateDictionary[value]) {
                            this.templateDictionary[value] = $.get(value);
                        }
                        this.templateDictionary[value].done(function (template) {
                            $(element).html(template);
                            $(element).children().each(function (index, child) {
                                ko.applyBindings(bindingContext, child);
                            });
                        });
                    }
                };

                ko.bindingHandlers.htmlUrl = {
                    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                        let value = ko.unwrap(valueAccessor());
                        markupLoader.loadMarkup(element, value, bindingContext);
                        return { controlsDescendantBindings: true };
                    }
                };
            }

            setupHtmlUrlHandler();

			return Auth.check(userTypesAccessList);
		},
		validate: function (form) {
			var t = !1, i = form,
                r = $(i).find(".required"),
                u = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/,
				f = /^(?=.*[0-9])[- +()0-9]+$/,
				e = /^(\d)+$/,
				p = /^.{6,160}$/,
				k = /^[0-9]{11}$/;
			if (r.each(function (n, i) {
			$(i).removeClass("error");
				//console.log($(i).attr("id") + ": " + ($(i).val() == "" ? "1" : "0"));
			$(i).val() == "" && ($(i).addClass("error"),
			$(".error").first().focus(),
			t = !0);
				//$(i).is("select") && ($(i).removeClass("error"),
				//$(i).hasClass("error") && ($(i).addClass("error"),
				//$(".error").first().focus(),
				//t = !0));
			$(i).hasClass("email") && !u.test($(i).val()) && ($(i).addClass("error"),
			t = !0);
			$(i).hasClass("tckn") && !k.test($(i).val()) && ($(i).addClass("error"),
			t = !0);
			$(i).hasClass("phone") && !f.test($(i).val()) && ($(i).addClass("error"),
			t = !0);
			$(i).hasClass("number") && !e.test($(i).val()) && ($(i).addClass("error"),
			t = !0);
			$(i).hasClass("password") && !p.test($(i).val()) && ($(i).addClass("error"),
			t = !0);
			$(i).hasClass("captcha") && $(".result").val() != $(i).val() && ($(i).addClass("error"),
			t = !0)
			}),
			t) {
				$("html, body").animate({ scrollTop: $(i).offset().top - 80 },
				500);
				return false;
			} else {
				return true;
			}
		},
		redirect: function (url) {
			Redirect(url);
		}
	},
	Users = {
		init: function () {
		},
		showForm: function (user) {

		}
	},
	Login = {
		init: function () {
			$("#loginbutton").click(function (e) {
				e.preventDefault();
				var e = $("#email").val();
				var p = $("#password").val();
				API.login(e, p, function (user) {
					if (user) {
						User = user;
						Redirect("/");
					} else {
						animate({
							name: 'shake',
							selector: '#login-form'
						});
					}
				});
			});
		},
		logout: function () {
			Auth.remove();
			Site.redirect("/");
		}
	},
	Auth = {
	    ACL: function() {
            var user = (localStorage.getItem('user')) ? JSON.parse(localStorage.getItem('user')) : null;
            var userType = user && user.Type;
            var model = {
                isAdmin: userType === 'Admin',
                isEmployee: userType === 'Employee',
                isCustomer: userType === 'Customer',
                isAdminOrEmployee: ['Admin', 'Employee'].indexOf(userType) > -1,
                sameOrganization: function (organizationId) {
                    return user && user.Organization === organizationId;
                }
            };

            return model;
        },
		check: function (userTypesAccessList = []) {
			var user = (localStorage.getItem('user')) ? JSON.parse(localStorage.getItem('user')) : null;
			if (user == null) {
				console.log("N/A");
				Site.redirect("/login.html");
                return false;
			} else {
				User = user;
				if (userTypesAccessList.length && userTypesAccessList.indexOf(User.Type) === -1) {
				    console.log('User type ' + User.Type + ' is not available to access this page');
                    Site.redirect("/index.html");
                    return false;
                }

				return true;
			}
		},
		save: function () {
			localStorage.setItem('user', JSON.stringify(User));
		},
		remove: function () {
			localStorage.removeItem('user');
		}
	},
	API = {
		login: function (email, password, callback) {
			User = {};
			API.post("/users/login", { Email: email, Password: password }, function (user) {
				if (user && user.Type) {
					User = user;
					Auth.save(User);
					callback(User);
				} else {
					callback(false);
				}
			});
		},
		properties: function (callback) {
			API.get("/properties", function (data) {
				callback(data);
			});
		},
		property: function (id, callback) {
			API.get("/properties/"+id, function (data) {
				callback(data);
			});
		},
		users: function (callback) {
			API.get("/users", function (data) {
				callback(data);
			});
		},
		user: function (id, callback) {
			API.get("/users/" + id, function (data) {
				callback(data);
			});
		},
		createUser: function (user, callback) {
			API.post("/users", user, function (data) {
				callback(data);
			});
		},
		updateUser: function (id, user, callback) {
			API.post("/users/" + id, user, function (data) {
				callback(data);
			});
		},
		organizations: function (callback) {
			API.get("/organizations", function (data) {
				callback(data);
			});
		},
		organization: function (id, callback) {
			API.get("/organizations/" + id, function (data) {
				callback(data);
			});
		},
		createOrganization: function (organization, callback) {
			API.post("/organizations", organization, function (data) {
				callback(data);
			});
		},
		createThumbnail: function (imageLink, callback) {
			API.get("/image/generate-thumbnail/" + imageLink, function (data) {
                callback && callback(data);
			});
		},
		updateOrganization: function (id, organization, callback) {
			API.post("/organizations/" + id, organization, function (data) {
				callback(data);
			});
		},
		equipments: function (callback) {
			API.get("/equipments", function (data) {
				callback(data);
			});
		},
		equipment: function (id, callback) {
			API.get("/equipments/" + id, function (data) {
				callback(data);
			});
		},
		createEquipment: function (equipment, callback) {
			API.post("/equipments", equipment, function (data) {
				callback(data);
			});
		},
		updateEquipment: function (id, equipment, callback) {
			API.post("/equipments/" + id, equipment, function (data) {
				callback(data);
			});
		},
		createEquipmentDevice: function (equipmentid, device, callback) {
			API.post("/equipments/device/" + equipmentid, device, function (data) {
				callback(data);
			});
		},
		updateEquipmentDevice: function (equipmentid, deviceid, device, callback) {
			API.post("/equipments/device/" + equipmentid + "/" + deviceid, device, function (data) {
				callback(data);
			});
		},
		constructiontypes: function (callback) {
			API.get("/constructiontypes", function (data) {
				callback(data);
			});
		},
		constructiontype: function (id, callback) {
			API.get("/constructiontypes/" + id, function (data) {
				callback(data);
			});
		},
		createConstructiontype: function (constructiontype, callback) {
			API.post("/constructiontypes", constructiontype, function (data) {
				callback(data);
			});
		},
		updateConstructiontype: function (id, constructiontype, callback) {
			API.post("/constructiontypes/" + id, constructiontype, function (data) {
				callback(data);
			});
		},
		occupancytypes: function (callback) {
			API.get("/occupancytypes", function (data) {
				callback(data);
			});
		},
		occupancytype: function (id, callback) {
			API.get("/occupancytypes/" + id, function (data) {
				callback(data);
			});
		},
		createOccupancytype: function (occupancytype, callback) {
			API.post("/occupancytypes", occupancytype, function (data) {
				callback(data);
			});
		},
		updateOccupancytype: function (id, occupancytype, callback) {
			API.post("/occupancytypes/" + id, occupancytype, function (data) {
				callback(data);
			});
		},
		post: function (URL, Params, Callback) {
			$.post(Config.APIURL + URL + "?hash=" + User._id, Params, function (data) {
				Callback(data);
			});
		},
		get: function (URL, Callback) {
			$.get(Config.APIURL + URL + "?hash=" + User._id, function (data) {
				Callback(data);
			});
		}
	}
});

function Redirect(URL) {
	//window.location.href = Config.BaseURL + URL;
	window.location.href = "/admin" + URL;
}

function QueryString(name, url) {
	if (!url) url = window.location.href;
	name = name.replace(/[\[\]]/g, "\\$&");
	var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, " "));
}
