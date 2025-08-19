sap.ui.define(["sap/ui/core/UIComponent", "sap/ui/model/resource/ResourceModel"], (UIComponent, ResourceModel) => {
	"use strict";
	return UIComponent.extend("sap.ui.demo.todo.Component", {
		metadata: {
			manifest: "json",
			interfaces: ["sap.ui.core.IAsyncContentCreation"],
		}
	});
});
