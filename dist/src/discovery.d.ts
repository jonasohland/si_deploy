import * as dnssd from 'dnssd';
export declare function getWebinterfaceAdvertiser(netif?: string): dnssd.Advertisement;
export declare function getServerAdvertiser(netif?: string): dnssd.Advertisement;
export declare function getServerBrowser(netif?: string): dnssd.Browser;
