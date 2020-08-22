import * as dnssd from 'mdns';
export declare function getWebinterfaceAdvertiser(port: number, netif?: string): dnssd.Advertisement;
export declare function getServerAdvertiser(port: number, netif?: string): dnssd.Advertisement;
export declare function getServerBrowser(netif?: string): dnssd.Browser;
