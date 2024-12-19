"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CampaignDAO } from '@/services/campaign-services';
import { StageDAO } from '@/services/stage-services';
import { useEffect, useState } from 'react';
import { setMoveToStageIdOfCampaignAction } from '../campaign-actions';

type Props = {
    campaign: CampaignDAO
    stages: StageDAO[]
}
export default function SelectStage({ campaign, stages }: Props) {
    const [loading, setLoading] = useState(false)
    const [selectedStageId, setSelectedStageId] = useState<string | undefined>(campaign.moveToStageId || "none")

    useEffect(() => {
        setSelectedStageId(campaign.moveToStageId || "none")
    }, [campaign])

    function onSelectStage(stageId: string | undefined) {   
        setLoading(true)
        setMoveToStageIdOfCampaignAction(campaign.id, stageId || null)
        .then(updated => {
            if (updated) {
                setSelectedStageId(stageId)
            }
        })
        .finally(() => {
            setLoading(false)
        })
    }

    return (
        <div>
            <Select value={selectedStageId || "none"} onValueChange={onSelectStage}>
                <SelectTrigger>
                    {selectedStageId === 'none' ?
                        <SelectValue placeholder="Seleccionar estado">Seleccionar estado</SelectValue> :
                        <SelectValue placeholder="Seleccionar estado">{stages.find(s => s.id === selectedStageId)?.name}</SelectValue>
                    }
                </SelectTrigger>
                <SelectContent>
                    {selectedStageId && selectedStageId !== 'none' && (
                        <SelectItem value="none" className="text-red-500 font-bold">Quitar selección</SelectItem>
                    )}
                    {stages.map(stage => (
                        <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
};