"use client"

import { FunctionClientDAO } from '@/services/function-services';
import { StageDAO } from '@/services/stage-services';
import { useEffect, useState } from 'react';
import { setMoveToStageIdOfClientFunctionAction } from '../repository-actions';
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';

type Props = {
    functionName: string
    functionClient: FunctionClientDAO
    stages: StageDAO[]
}
export default function SelectStage({ functionName, functionClient, stages }: Props) {
    const [loading, setLoading] = useState(false)
    const [selectedStageId, setSelectedStageId] = useState<string | null>(functionClient.moveToStageId || null)

    useEffect(() => {
        setSelectedStageId(functionClient.moveToStageId || null)
    }, [functionClient])

    function onSelectStage(stageId: string) {   
        setLoading(true)
        setMoveToStageIdOfClientFunctionAction(functionClient.clientId, functionClient.functionId, stageId)
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