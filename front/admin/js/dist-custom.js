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
            const user = Auth.getCurrentUser();
            const userType = user && user.Type;
            const model = {
                user,
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
        getCurrentUser: function() {
	        if (User) {
	            return User;
            }

            const storedUserData = (localStorage.getItem('user')) ? JSON.parse(localStorage.getItem('user')) : null;
            if (storedUserData) {
                User = {
                    ...storedUserData,
                    get notificationSupported() {
                        return ('Notification' in window);
                    },
                    get notificationGranted() {
                        return this.notificationSupported && Notification.permission === 'granted';
                    },
                    _notificationIcon: ko.observable('fa-bell-o'),
                    get notificationIcon() {
                        const newIcon = this.notificationGranted ? 'fa-bell-o' : 'fa-bell-slash-o';
                        if (this._notificationIcon() !== newIcon) {
                            this._notificationIcon(newIcon)
                        }
                        return this._notificationIcon;
                    },
                    _notificationsStats: ko.observable({notifications: [], notReadCount: 0}),
                    get notificationsStats() {
                        return this._notificationsStats();
                    },
                    set notificationsStats(notificationsStats) {
                        return this._notificationsStats(notificationsStats);
                    },
                    fetchNotifications() {
                        API.notificationsStats({limit: 6}, notificationsStats => {
                            User.notificationsStats = notificationsStats
                        })
                    }
                };

                User.fetchNotifications();
                return User;
            }
        },
		check: function (userTypesAccessList = []) {
            const user = Auth.getCurrentUser();
			if (user == null) {
				console.log("N/A");
				Site.redirect("/login.html");
                return false;
			} else {
				if (userTypesAccessList.length && userTypesAccessList.indexOf(user.Type) === -1) {
				    console.log('User type ' + user.Type + ' is not available to access this page');
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
		property: function (id, callback, level) {
		    const queryParamsString = level ? `?level=${level}` : '';
			API.get(`/properties/${id}${queryParamsString}`, function (data) {
				callback(data);
			});
		},
        updateProperty: function (id, property, callback) {
            API.post("/properties/" + id, property, function (data) {
                callback(data);
			});
		},
		updateDevice: function (id, device, callback) {
            API.post("/devices/" + id, device, function (data) {
				callback && callback(data);
			});
		},
        buildings: function (queryParams = {}, callback) {
            const url = `/buildings?${Object.keys(queryParams).map(key => `${key}=${queryParams[key]}`)}`;
            API.get(url, callback);
        },
		building: function (id, callback) {
			API.get("/buildings/"+id, callback);
		},
        updateBuilding: function (id, building, callback) {
            API.post("/buildings/" + id, building, callback);
        },
        copyBuilding: function (id, callback) {
            API.get("/buildings/" + id + "/copy", callback);
        },
        floors: function (queryParams = {}, callback) {
            const url = `/floors?${Object.keys(queryParams).map(key => `${key}=${queryParams[key]}`)}`;
            API.get(url, callback);
        },
        floor: function (id, callback) {
            API.get("/floors/"+id, callback);
        },
        updateFloor: function (id, floor, callback) {
            API.post("/floors/" + id, floor, callback);
        },
        copyFloor: function (id, callback) {
            API.get("/floors/" + id + "/copy", callback);
        },
        devices: function (queryParams = {}, callback) {
            const url = `/devices?${Object.keys(queryParams).map(key => `${key}=${queryParams[key]}`)}`;
            API.get(url, callback);
        },
		deleteInspection: function (id, callback) {
			API.delete("/inspections/"+id, function (data) {
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
		deleteUser: function (id, callback) {
			API.delete("/users/" + id, function (data) {
				callback(data);
			});
		},
		addTokenToCurrentUser: function (token, callback) {
		    const tokenData = {
                Token: token,
                UserAgent: navigator.userAgent
            };
			API.post("/me/addTokenToUser", tokenData, function (data) {
                callback && callback(data);
			});
		},
        deleteTokenFromCurrentUser: function (token, callback) {
            API.post("/me/deleteTokenFromUser", {Token: token}, function (data) {
                callback && callback(data);
            });
        },
        notificationsStats: function (options, callback) {
		    if (typeof options === 'function') {
		        callback = options;
                options = {};
            }
            options.limit = options.limit || 100;
            options.skip = options.skip || 0;

			API.get(`/notifications/stats?limit=${options.limit}&skip=${options.skip}`, function (data) {
				callback(data);
			});
		},
        notification: function (id, callback) {
		    API.get(`/notifications/${id}`, function (data) {
                callback && callback(data);
			});
		},
        notifications: function (options, callback) {
		    if (typeof options === 'function') {
		        callback = options;
                options = {};
            }
            options.limit = options.limit || 100;
            options.skip = options.skip || 0;

			API.get(`/notifications?limit=${options.limit}&skip=${options.skip}`, function (data) {
                callback && callback(data);
			});
		},
        notificationMarkAsRead: function (notificationID, callback) {
			API.post(`/notifications/${notificationID}/read`, {},function (data) {
                callback && callback(data);
			});
		},
        notificationMarkAllAsRead: function (callback) {
			API.post(`/notifications/readAll`, {},function (data) {
                callback && callback(data);
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
		organizationUsers: function (organizationId, callback) {
			API.get("/organizations/" + organizationId + "/users", function (data) {
				callback(data);
			});
		},
		createOrganization: function (organization, callback) {
			API.post("/organizations", organization, function (data) {
				callback(data);
			});
		},
		uploadImage: function (imageBlobFile, callback) {
            var formData = new FormData();
            formData.append("Photo", imageBlobFile);

            $.ajax({
                url: Config.APIURL + "/image",
                type: "POST",
                data: formData,
                processData: false,
                contentType: false,
                success: function(imageFileName) {
                    const imageURL = `${Config.APIURL}/img/${imageFileName}`;
                    callback(imageURL);
                }
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
		documents: function (propertyID, callback) {
			API.get(
				"/documents?PropertyID=" + propertyID,
				function (data) {
					callback(data);
				});
		},
		generateDocuments: function (documents, callback) {
			API.post(
				"/documents/fire-safety/generate-bulk",
				{documents},
				function (data) {
					callback(data);
				});
		},
		rebuildDocuments: function (documentIds, callback) {
			API.post(
				"/documents/rebuild",
				{documents: documentIds},
				function (data) {
					callback(data);
				});
		},
		exportPropertyDocuments: function (documentIds, propertyID, callback) {
			this.postDownloadFile(`/documents/documentsZip?PropertyID=${propertyID}&hash=${User._id}`, {documentIds}, callback);
		},
		exportPropertyDocumentsCSV: function (documentIds, propertyID, callback) {
			this.postDownloadFile(`/documents/documentsCSV?PropertyID=${propertyID}&hash=${User._id}`, {documentIds}, callback);
		},
		activateDocument: function (documentID, callback) {
			API.get("/documents/" + documentID + "/activate", callback);
		},
		deactivateDocument: function (documentID, callback) {
			API.get("/documents/" + documentID + "/deactivate", callback);
		},
		notifyDocument: function (documentID, callback) {
			API.get("/documents/" + documentID + "/notify", callback);
		},
		documentsNotifyBatch: function (documents, callback) {
			API.post("/documents/notify-batch", {documents}, callback);
		},
		documentsBatch: function (documents, callback) {
			API.post("/documents/batch", {documents}, callback);
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
			// $.post(Config.APIURL + URL + "?hash=" + User._id, Params, function (data) {
			// 	Callback(data);
			// });

			$.ajax({
				url: Config.APIURL + URL + "?hash=" + User._id,
				type: "POST",
				data: JSON.stringify(Params),
				dataType: "json",
				mimeType: "application/json",
				contentType: "application/json",
				success: Callback
			});
		},
		get: function (URL, Callback) {
			$.get(Config.APIURL + URL + (URL.indexOf('?') >= 0 ? '&' : '?') + "hash=" + User._id, function (data) {
				Callback(data);
			});
		},
        delete: function (URL, Callback) {
            var url = Config.APIURL + URL + (URL.indexOf('?') >= 0 ? '&' : '?') + "hash=" + User._id;
            $.ajax({
                url: url,
                type: 'DELETE',
                success: function (data) {
                    Callback(data);
                }
            });
        },
		postDownloadFile(urlToSend, data, onload) {
			var req = new XMLHttpRequest();

			req.open("POST", urlToSend, true);
			req.responseType = "blob";
			req.setRequestHeader("Content-Type", "application/json");

			req.onload = function (event) {
				var blob = req.response;
				var fileName = "Exported Documents.zip";
				if (req.getResponseHeader("content-disposition")) {
					var contentDisposition = req.getResponseHeader("content-disposition");
					fileName = contentDisposition.substring(contentDisposition.indexOf("=") + 1);
					fileName = decodeURIComponent(fileName);
				}

				var link = document.createElement('a');
				link.href = window.URL.createObjectURL(blob);
				link.download = fileName;
				link.click();

				onload && onload(event);
			}

			req.send(data ? JSON.stringify(data) : undefined);

			return req;
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
