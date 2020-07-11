
export function webifResponseEvent(nodeid: string, modulename: string, event: string)
{
    return `${nodeid}.${modulename}.${event}`;
}