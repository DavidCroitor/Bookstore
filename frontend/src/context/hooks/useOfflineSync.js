import { useState, useEffect, useCallback, useRef } from 'react';
import { storage } from '../storage';
import * as bookApi from '../bookApi'; // Import all API functions
import { LS_ACTION_QUEUE_KEY } from '../constants';

export const useOfflineSync = (isOnline, isServerReachable, onSyncComplete) => {
    const [actionQueue, setActionQueue] = useState(() => storage.getItem(LS_ACTION_QUEUE_KEY) || []);
    const [isSyncing, setIsSyncing] = useState(false);
    const isSyncingRef = useRef(isSyncing); // Ref to track sync state in async callbacks

    useEffect(() => {
        isSyncingRef.current = isSyncing;
    }, [isSyncing]);

    // Persist queue to localStorage whenever it changes
    useEffect(() => {
        storage.setItem(LS_ACTION_QUEUE_KEY, actionQueue);
    }, [actionQueue]);

    const queueAction = useCallback((action, data) => {
        const timestamp = new Date().toISOString();
        // Ensure data has an ID, even if it's local
        const idForAction = data.id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const actionId = `${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
        const newItem = { 
            id: actionId, 
            action, 
            timestamp, 
            data 
        };

        setActionQueue(prevQueue => [...prevQueue, newItem]);
        console.log('Action queued:', newItem);
    }, []);

    const processQueue = useCallback(async () => {
        if (isSyncingRef.current || actionQueue.length === 0) {
            return { 
                success: true, 
                processedCount: 0, 
                idMapping: {} 
            }; // Nothing to do or already syncing
        }

        setIsSyncing(true);
        console.log(`Starting sync process for ${actionQueue.length} items...`);

        const currentQueue = [...actionQueue]; // Work on a snapshot
        const results = [];
        const successfullyProcessedIds = new Set();
        const idMapping = {}; // Map local IDs to server IDs

        for (const item of currentQueue) {
            // Skip if item structure is invalid
            if (!item || !item.action || !item.data || !item.id) {
                console.error('Skipping invalid action item:', item);
                results.push({ 
                    success: false, 
                    item, 
                    error: 'Invalid action item structure.' 
                });
                continue;
            }
            try {
                let resultData = null;
                const isLocalId = typeof item.data?.id === 'string' && item.data.id.startsWith('local_');
                const originalId = item.data?.id;

                switch (item.action) {
                    case 'add':
                        resultData = await bookApi.addBookAPI(item.data);
                        if (isLocalId && resultData?.id) {
                            idMapping[originalId] = resultData.id;
                        }
                        break;
                    case 'update': 
                        if (isLocalId) {
                            const serverIdMapped = idMapping[originalId];
                            if (serverIdMapped) {
                                // Update existing server item
                                console.log(`Updating server item for ${originalId} to ${serverIdMapped}.`);
                                const { id: updatedId, ...updateData } = item.data;
                                resultData = await bookApi.updateBookAPI(serverIdMapped, updateData);
                            }else {
                                // No server ID found, treat as add
                                console.log(`No server ID found for ${originalId}, treating as add.`);
                                const { id: localAddId, ...localAddData } = item.data;
                                resultData = await bookApi.addBookAPI(localAddData);
                                if (resultData?.id) {
                                    idMapping[originalId] = resultData.id; // Map local ID to new server ID
                                }
                            }
                        } else if (item.data?.id) {
                            console.log(`Updating server item ${item.data.id}.`);
                            const { id: updateId, ...updateData } = item.data;
                            resultData = await bookApi.updateBookAPI(updateId, updateData);
                        } else {
                            throw new Error('Update action missing required book ID.');
                        }
                        break;
                    case 'delete':
                         // Cannot delete a purely local item on the server
                         if (isLocalId) {
                            const serverIdMapped = idMapping[originalId];
                            if (serverIdMapped) {
                                console.log(`Deleting server item ${serverIdMapped}.`);
                                await bookApi.deleteBookAPI(serverIdMapped);
                                resultData = { success: true, id: serverIdMapped };
                            } else {
                                console.log(`No server ID found for ${originalId}, skipping delete.`);
                                resultData = { success: true, id: originalId }; // Mark as processed locally
                            }
                         } else if (item.data?.id) {
                            await bookApi.deleteBookAPI(item.data.id);
                            resultData = { success: true, id: item.data.id };
                         } else {
                             throw new Error('Delete action missing required book ID.');
                         }
                        break;
                    default:
                        throw new Error(`Unknown action type: ${item.action}`);
                }

                results.push({ success: true, item, data: resultData });
                successfullyProcessedIds.add(item.id); // Mark action item as successful
                console.log(`Successfully processed action: ${item.action} for book ${originalId || '(new)'}`);

            } catch (error) {
                console.error(`Failed to process action ${item.id} (${item.action}):`, error);
                results.push({ 
                    success: false, 
                    item, 
                    error: error.message 
                });
                 // Decide if you want to stop sync on first error or continue
                 // break; // Uncomment to stop on first error
            }
        }

        // Update queue by removing successfully processed items
        setActionQueue(prevQueue => prevQueue.filter(item => !successfullyProcessedIds.has(item.id)));

        console.log(`Sync process finished. Processed: ${successfullyProcessedIds.size}/${currentQueue.length}`);
        setIsSyncing(false);

        return {
            success: results.every(r => r.success), // Overall success? Maybe define differently
            processedCount: successfullyProcessedIds.size,
            results,
            idMapping
        };
    }, [actionQueue]); 

     // Effect to trigger sync when conditions are met
    useEffect(() => {
        if (isOnline && isServerReachable && actionQueue.length > 0 && !isSyncingRef.current) {
            console.log('Conditions met for sync, triggering...');
            const syncAndNotify = async () => {
                const { success, processedCount, idMapping } = await processQueue();
                if (processedCount > 0 && typeof onSyncComplete === 'function') {
                     // Pass relevant info back, like the ID mapping
                    onSyncComplete({ success, processedCount, idMapping });
                }
            };
            // Slight delay maybe?
            const timer = setTimeout(syncAndNotify, 500);
            return () => clearTimeout(timer);
        }
    }, [isOnline, isServerReachable, actionQueue, processQueue, onSyncComplete]);

    return {
        actionQueue: actionQueue.length, // Expose count
        isSyncing,
        queueAction,
        triggerSync: processQueue // Allow manual trigger if needed
    };
};