import { getClientBySlug, getWhatsappInstance } from "@/services/clientService";
import { notFound } from "next/navigation";
import Script from "next/script";

type Props = {
    params: Promise<{
        slug: string;
    }>;
};

export default async function WidgetPage(props: Props) {
    const params = await props.params;
    const { slug } = params
    const client = await getClientBySlug(slug)

    if (!client) {
        return notFound()
    }

    const whatsappInstance = await getWhatsappInstance(client.id)

    if (!whatsappInstance) {
        return <div>Whatsapp instance no está configurada</div>
    }

    const chatwootWidgetToken = whatsappInstance.chatwootWidgetToken

    return (
        <div>
            <h1 className="text-4xl font-bold text-center my-8 tracking-wide py-2 px-4 border-b-2 border-muted-foreground mx-auto max-w-4xl">
                {client.name}
            </h1>

            {!chatwootWidgetToken && (
                <p className="p-10 border border-dashed border-red-500 rounded-lg text-center mt-10">Chatwoot widget token no está configurado</p>
            )}

            {chatwootWidgetToken && (
                <Script id="chatwoot" strategy="afterInteractive">
                    {`
                        window.chatwootSettings = {"position":"right","type":"expanded_bubble","launcherTitle":"Chatea con nosotros"};
                        (function(d,t) {
                            var BASE_URL="https://agentes.shock.uy";
                            var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
                            g.src=BASE_URL+"/packs/js/sdk.js";
                            g.defer = true;
                            g.async = true;
                            s.parentNode.insertBefore(g,s);
                            g.onload=function(){
                            window.chatwootSDK.run({
                                websiteToken: '${chatwootWidgetToken}',
                                baseUrl: BASE_URL
                            })
                            }
                        })(document,"script");
                `}
                </Script>
            )}
        </div>
    );
}