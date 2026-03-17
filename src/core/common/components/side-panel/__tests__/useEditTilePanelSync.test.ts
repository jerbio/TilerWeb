import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEditTilePanelSync } from '../useEditTilePanelSync';
import { CalendarEvent } from '@/core/common/types/schedule';

const mockEvent: CalendarEvent = {
	id: 'evt-1',
	start: 1769925600000,
	end: 1770532200000,
	name: 'work out',
	address: '',
	addressDescription: '',
	searchdDescription: '',
	splitCount: 4,
	completeCount: 0,
	deletionCount: 0,
	thirdpartyType: 'tiler',
	thirdPartyId: null,
	thirdPartyUserId: null,
	colorOpacity: null,
	colorRed: null,
	colorGreen: null,
	colorBlue: null,
	isComplete: false,
	isEnabled: true,
	isRecurring: false,
	locationId: null,
	isReadOnly: false,
	isProcrastinateEvent: false,
	isRigid: false,
	uiConfig: { id: 'ui-1' } as CalendarEvent['uiConfig'],
	repetition: null,
	eachTileDuration: 3600000,
	restrictionProfile: null,
	emojis: null,
	isWhatIf: false,
	entityName: 'CalendarEvent',
	blob: { type: 0, note: '', id: 'blob-1' },
	subEvents: null,
};

describe('useEditTilePanelSync', () => {
	let pushPanel: ReturnType<typeof vi.fn>;
	let popPanel: ReturnType<typeof vi.fn>;
	let closeEditTile: ReturnType<typeof vi.fn>;
	let setSidePanelExpanded: ReturnType<typeof vi.fn>;
	let setMobileChatVisible: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		pushPanel = vi.fn();
		popPanel = vi.fn();
		closeEditTile = vi.fn();
		setSidePanelExpanded = vi.fn();
		setMobileChatVisible = vi.fn();
	});

	it('pushes panel when editTile opens', () => {
		renderHook(() =>
			useEditTilePanelSync({
				editTileIsOpen: true,
				editTileEvent: mockEvent,
				pushPanel,
				popPanel,
				closeEditTile,
				setSidePanelExpanded,
				setMobileChatVisible,
			}),
		);

		expect(pushPanel).toHaveBeenCalledOnce();
	});

	it('does not push when editTile is closed', () => {
		renderHook(() =>
			useEditTilePanelSync({
				editTileIsOpen: false,
				editTileEvent: null,
				pushPanel,
				popPanel,
				closeEditTile,
				setSidePanelExpanded,
				setMobileChatVisible,
			}),
		);

		expect(pushPanel).not.toHaveBeenCalled();
	});

	it('auto-expands collapsed side panel when editTile opens', () => {
		renderHook(() =>
			useEditTilePanelSync({
				editTileIsOpen: true,
				editTileEvent: mockEvent,
				pushPanel,
				popPanel,
				closeEditTile,
				setSidePanelExpanded,
				setMobileChatVisible,
			}),
		);

		expect(setSidePanelExpanded).toHaveBeenCalledWith(false);
	});

	it('does not call setSidePanelExpanded when editTile is not opening', () => {
		renderHook(() =>
			useEditTilePanelSync({
				editTileIsOpen: false,
				editTileEvent: null,
				pushPanel,
				popPanel,
				closeEditTile,
				setSidePanelExpanded,
				setMobileChatVisible,
			}),
		);

		expect(setSidePanelExpanded).not.toHaveBeenCalled();
	});

	it('pops panel when editTile closes after being open', () => {
		const { rerender } = renderHook(
			({ isOpen, event }) =>
				useEditTilePanelSync({
					editTileIsOpen: isOpen,
					editTileEvent: event,
					pushPanel,
					popPanel,
					closeEditTile,
					setSidePanelExpanded,
					setMobileChatVisible,
				}),
			{ initialProps: { isOpen: true, event: mockEvent as CalendarEvent | null } },
		);

		expect(pushPanel).toHaveBeenCalledOnce();
		popPanel.mockClear();

		// Close the edit tile (simulating store change)
		rerender({ isOpen: false, event: null });

		expect(popPanel).toHaveBeenCalledOnce();
	});

	it('does not pop on initial render when closed', () => {
		renderHook(() =>
			useEditTilePanelSync({
				editTileIsOpen: false,
				editTileEvent: null,
				pushPanel,
				popPanel,
				closeEditTile,
				setSidePanelExpanded,
				setMobileChatVisible,
			}),
		);

		expect(popPanel).not.toHaveBeenCalled();
	});

	it('onClose callback pops panel and closes store', () => {
		const { result } = renderHook(() =>
			useEditTilePanelSync({
				editTileIsOpen: true,
				editTileEvent: mockEvent,
				pushPanel,
				popPanel,
				closeEditTile,
				setSidePanelExpanded,
				setMobileChatVisible,
			}),
		);

		// The push call should have passed an entry whose onClose we can extract
		// onClose is exposed on the hook return for the caller to wire into the panel
		act(() => {
			result.current.closePanelAndStore();
		});

		expect(popPanel).toHaveBeenCalled();
		expect(closeEditTile).toHaveBeenCalled();
	});
});
