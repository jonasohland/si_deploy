
export function webifResponseEvent(nodeid: string, modulename: string, event: string)
{
    return `${nodeid}.${modulename}.${event}`;
}

export function clientNodeRoomName(nodeid: string, module: string, topic: string)
{
    return `${nodeid}-${module}-${topic}`;
}

export function clientServerRoomName(module: string, topic: string) 
{
    return `${module}-${topic}`;
}