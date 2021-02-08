import ConduitGrpcSdk, {
    ConduitRoute,
    ConduitRouteActions, ConduitRouteReturnDefinition,
    constructRoute, TYPE
} from "@quintessential-sft/conduit-grpc-sdk";
import {FormRoutes} from "../routes/Routes";
import {FormsSchema} from "../models";

export class FormsController {
    private _adapter: any;

    constructor(
        private readonly grpcSdk: ConduitGrpcSdk,
        private router: FormRoutes
    ) {
        this._adapter = this.grpcSdk.databaseProvider!;
        this.loadExistingForms();
        this.initializeState();
    }

    initializeState() {
        this.grpcSdk.bus?.subscribe("forms", (message: string) => {
            if (message === "form") {
                this.refreshRoutes();
            }
        });
    }

    private async loadExistingForms() {
        await this._adapter.createSchemaFromAdapter(FormsSchema);
        this._adapter
            .findMany("Forms", {enabled: true})
            .then((r: any) => {
                this._registerRoutes(r);
                this.router.requestRefresh();
            })
            .catch((err: Error) => {
                console.error("Something went wrong when loading forms for forms module");
                console.error(err);
            });
    }

    refreshRoutes() {
        this._adapter
            .findMany("Forms", {enabled: true})
            .then((r: any) => {
                this._registerRoutes(r);
                this.router.requestRefresh();
            })
            .catch((err: Error) => {
                console.error("Something went wrong when loading forms for forms module");
                console.error(err);
            });
    }

    private _registerRoutes(forms: { [name: string]: any }) {
        let routesArray: any = [];
        forms.forEach((r: any) => {
            Object.keys(r.fields).forEach(key => {
                r.fields[key] = TYPE.String
            })
            routesArray.push(constructRoute(new ConduitRoute({
                    path: `/form/${r.name}`,
                    action: ConduitRouteActions.POST,
                    bodyParams: r.fields,
                }, new ConduitRouteReturnDefinition(`submitForm${r.name}`, "String"),
                'submitForm')));
        })
        this.router.addRoutes(routesArray);
    }
}
