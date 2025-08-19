sap.ui.define([
	"sap/ui/Device",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel",
	"sap/base/strings/formatMessage",
	"sap/m/MessageToast",
	'sap/m/ColumnListItem',
	'sap/m/Input',
	'sap/ui/model/resource/ResourceModel'
], (Device, Controller, Filter, FilterOperator, JSONModel, formatMessage, MessageToast, ColumnListItem, Input, ResourceModel) => {
	"use strict";

	let _oController;
	let _oBundle;

	return Controller.extend("sap.ui.demo.todo.controller.App", {

		onInit() {
			_oController = this;

			this.getView().setModel(new JSONModel({
				isMobile: Device.browser.mobile,
				separator: 'C',
				format: 'yyyy-MM-dd',
				action: 'LoadFromFile'
			}), "view");

			var oI18NModel = new ResourceModel({ bundleName: "sap.ui.demo.todo.i18n.i18n"});
			this.getView().setModel(oI18NModel, "i18n");

			_oBundle = this.getView().getModel("i18n").getResourceBundle();

		},

		/**
		 * Get the default model from the view
		 *
		 * @returns {sap.ui.model.json.JSONModel} The model containing the todo list, etc.
		 */
		getModel() {
			return this.getView().getModel();
		},

		handleUploadComplete: function(oEvent) {
			if (oEvent.mParameters.status === 200) {
				MessageToast.show(oEvent.mParameters.status === 200 ? "Upload Successful" : "Upload Failed!");
				let json = JSON.parse(oEvent.mParameters.responseRaw);
				_oController.handleResponse(json);
			} else {
				MessageToast.show("Upload Failed!");
			}
		},

		handleResponse: function(json) {
			let oResponseModel = new JSONModel();
			oResponseModel.setData(json.pairList);
			this.getOwnerComponent().setModel(oResponseModel, "responses");
			// oCountriesModel.setSizeLimit(data.length);
			oResponseModel.updateBindings(true);

			let oCsvModel = new JSONModel();
			oCsvModel.setData(json.csv);
			this.getOwnerComponent().setModel(oCsvModel, "csv");
			// oCountriesModel.setSizeLimit(data.length);
			oCsvModel.updateBindings(true);

			let csv = 'EmpID1, EmpID2, ProjectID, Days\n';
			for (let line of json.pairList) {
				csv += line.empID1 + ', ' + line.empID2 + ', ' + line.projectID + ', ' + line.days + '\n';
			}

			let oResponseCsvModel = new JSONModel();
			oResponseCsvModel.setData({
				csv: csv
			});
			this.getOwnerComponent().setModel(oResponseCsvModel, "responseCsv");
			oResponseCsvModel.updateBindings(true);

			let _csv = 'EmpID, ProjectID, DateFrom, DateTo\n';
			for (let line of json.csv) {
				_csv += line.empID + ', ' + line.projectID + ', ' + line.dateFrom + ', ' + line.dateTo + '\n';
			}

			let oOriginalCsvModel = new JSONModel();
			oOriginalCsvModel.setData({
				csv: _csv
			});
			this.getOwnerComponent().setModel(oOriginalCsvModel, "originalCsv");
			oOriginalCsvModel.updateBindings(true);

			let _json = '{\n' +
				'    "format": "' + this.getView().getModel('view').getData().format + '",\n' +
				'    "employees": [\n';
			let counter = 0;
			for (let line of json.csv) {
				if (counter++ !== 0) _json += '\n,\n';
				_json += '{\"empID\": ' + line.empID + ', \"projectID\": ' + line.projectID + ', \"dateFrom\": \"' + line.dateFrom + '\", \"dateTo\": \"' + line.dateTo + '\"}';
			}
			_json += '\n]\n}';

			let oOriginalJsonModel = new JSONModel();
			oOriginalJsonModel.setData({
				json: _json
			});
			this.getOwnerComponent().setModel(oOriginalJsonModel, "originalJson");
			oOriginalJsonModel.updateBindings(true);
		},

		handleUploadPress: function() {
			let oFileUploader = this.byId("fileUploader");
			if (!oFileUploader.getValue()) {
				MessageToast.show("Choose a file first");
				return;
			}

			oFileUploader.checkFileReadable().then(function() {
				oFileUploader.setUploadUrl( _oBundle.getText('backend.url', []) + "/api/v1/employee/import/csv/" +
					_oController.getView().getModel('view').getData().format + '/' + _oController.getView().getModel('view').getData().separator);
				oFileUploader.setSendXHR(true);
				oFileUploader.upload();
				oFileUploader.destroyHeaderParameters();
			}, function(error) {
				MessageToast.show("The file cannot be read. It may have changed.");
			}).then(function() {
				oFileUploader.clear();
			});
		},

		handleValueChange: function (oEvent) {

		},

		handleTypeMissmatch: function(oEvent) {
			var aFileTypes = oEvent.getSource().getFileType();
			aFileTypes.map(function(sType) {
				return "*." + sType;
			});
			MessageToast.show("The file type *." + oEvent.getParameter("fileType") +
				" is not supported. Choose one of the following types: " +
				aFileTypes.join(", "));
		},

		onSendJsonToBackend: function(oEvent) {
			let oOriginalJsonModel = _oController.getOwnerComponent().getModel("originalJson");
			let sendJsonToBackendUrl = _oBundle.getText("backend.url", []) + '/api/v1/employee/import/json';
			jQuery.ajax({
				type: 'POST',
				url: sendJsonToBackendUrl,
				data: oOriginalJsonModel.getData().json,
				contentType: "application/json",
				success: function(data) {
					if (data !== null) {
						_oController.handleResponse(data);
					}
				},
				error: function(e) {
					MessageToast.show(_oBundle.getText("ajax.error"));
				}
			});
		},

		onSendCsvToBackend: function(oEvent) {
			let oOriginalCsvModel = _oController.getOwnerComponent().getModel("originalCsv");
			let sendCsvToBackendUrl = _oBundle.getText("backend.url", []) + '/api/v1/employee/import/text/' +
					_oController.getView().getModel('view').getData().format + '/' + _oController.getView().getModel('view').getData().separator;
			jQuery.ajax({
				type: 'POST',
				url: sendCsvToBackendUrl,
				data: oOriginalCsvModel.getData().csv,
				contentType: "text/csv",
				success: function(data) {
					if (data !== null) {
						_oController.handleResponse(data);
					}
				},
				error: function(e) {
					MessageToast.show(_oBundle.getText("ajax.error"));
				}
			});
		}

	});

});
