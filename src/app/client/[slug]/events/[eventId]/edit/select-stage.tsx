"use client"

import { FunctionClientDAO } from '@/services/function-services';
import { StageDAO } from '@/services/stage-services';
import { useEffect, useState } from 'react';
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EventDAO } from '@/services/event-services';
import { setMoveToStageIdEventAction } from '../../event-actions';

type Props = {
    event: EventDAO
    stages: StageDAO[]
}
export default function SelectEventStage({ event, stages }: Props) {
    const [loading, setLoading] = useState(false)
    const [selectedStageId, setSelectedStageId] = useState<string | null>(event.moveToStageId || null)

    useEffect(() => {
        setSelectedStageId(event.moveToStageId || null)
    }, [event])

    function onSelectStage(stageId: string) {   
        setLoading(true)
        setMoveToStageIdEventAction(event.id, stageId)
        .then(updated => {
            if (updated) setSelectedStageId(stageId)
        })
        .finally(() => {
            setLoading(false)
        })
    }

    return (
        <Select
            value={selectedStageId || undefined}
            onValueChange={onSelectStage}
        >
            <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
                {stages.map(stage => (
                    <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
};