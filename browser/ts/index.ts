import { SignedOrder } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';

import { wasmBuffer } from './generated/wasm_buffer';
import './wasm_exec';

export { SignedOrder } from '@0x/order-utils';
export { BigNumber } from '@0x/utils';

// The interval (in milliseconds) to check whether Wasm is done loading.
const wasmLoadCheckIntervalMs = 100;

// The Go code sets certain global values and this is our only way of
// interacting with it. Define those values and their types here.
declare global {
    // Defined in wasm_exec.ts
    class Go {
        public importObject: any;
        public run(instance: WebAssembly.Instance): void;
    }

    // Defined in ../go/main.go
    const zeroExMesh: ZeroExMesh;
}

// Note(albrow): This is currently copied over from core/core.go. We need to keep
// both definitions in sync, so if you change one you must also change the
// other.
/**
 * A set of configuration options for Mesh.
 */
export interface Config {
    // Verbosity is the logging verbosity. Defaults to Verbosity.Error meaning
    // only errors will be logged.
    verbosity?: Verbosity;
    // The URL of an Ethereum node which supports the Ethereum JSON RPC API.
    // Used to validate and watch orders.
    ethereumRPCURL: string;
    // The network ID to use when communicating with Ethereum.
    ethereumNetworkID: number;
    // UseBootstrapList is whether to bootstrap the DHT by connecting to a
    // specific set of peers.
    useBootstrapList?: boolean;
    // bootstrapList is a list of multiaddresses to use for bootstrapping the
    // DHT (e.g.,
    // "/ip4/3.214.190.67/tcp/60558/ipfs/16Uiu2HAmGx8Z6gdq5T5AQE54GMtqDhDFhizywTy1o28NJbAMMumF").
    // Defaults to the hard-coded default bootstrap list.
    bootstrapList?: string[];
    // The amount of time (in seconds) before the order's stipulated expiration
    // time that it will be considered expired. Higher values will cause orders
    // to be considered invalid sooner. Defaluts to 10.
    orderExpirationBufferSeconds?: number;
    // The polling interval (in seconds) to wait before checking for a new
    // Ethereum block that might contain transactions that impact the
    // fillability of orders stored by Mesh. Different networks have different
    // block producing intervals: POW networks are typically slower (e.g.,
    // Mainnet) and POA networks faster (e.g., Kovan) so one should adjust the
    // polling interval accordingly. Defaults to 5.
    blockPollingIntervalSeconds?: number;
    // The maximum request Content-Length accepted by the backing Ethereum RPC
    // endpoint used by Mesh. Geth & Infura both limit a request's content
    // length to 1024 * 512 Bytes. Parity and Alchemy have much higher limits.
    // When batch validating 0x orders, we will fit as many orders into a
    // request without crossing the max content length. The default value is
    // appropriate for operators using Geth or Infura. If using Alchemy or
    // Parity, feel free to double the default max in order to reduce the number
    // of RPC calls made by Mesh. Defaults to 524288 bytes.
    ethereumRPCMaxContentLength?: number;
}

export enum Verbosity {
    Panic = 0,
    Fatal = 1,
    Error = 2,
    Warn = 3,
    Info = 4,
    Debug = 5,
    Trace = 6,
}

// The global entrypoint for creating a new MeshWrapper.
interface ZeroExMesh {
    newWrapperAsync(config: WrapperConfig): Promise<MeshWrapper>;
}

// A direct translation of the MeshWrapper type in Go. Its API exposes only
// simple JavaScript types like number and string, some of which will be
// converted. For example, we will convert some strings to BigNumbers.
interface MeshWrapper {
    startAsync(): Promise<void>;
    onError(handler: (err: Error) => void): void;
    onOrderEvents(handler: (events: WrapperOrderEvent[]) => void): void;
    addOrdersAsync(orders: WrapperSignedOrder[]): Promise<WrapperValidationResults>;
}

// The type for configuration exposed by MeshWrapper.
interface WrapperConfig {
    verbosity?: number;
    ethereumRPCURL: string;
    ethereumNetworkID: number;
    useBootstrapList?: boolean;
    bootstrapList?: string; // comma-separated string instead of an array of strings.
    orderExpirationBufferSeconds?: number;
    blockPollingIntervalSeconds?: number;
    ethereumRPCMaxContentLength?: number;
}

// The type for signed orders exposed by MeshWrapper. Unlike other types, the
// analog isn't defined here. Instead we re-use the definition in
// @0x/order-utils.
interface WrapperSignedOrder {
    makerAddress: string;
    makerAssetData: string;
    makerAssetAmount: string;
    makerFee: string;
    takerAddress: string;
    takerAssetData: string;
    takerAssetAmount: string;
    takerFee: string;
    senderAddress: string;
    exchangeAddress: string;
    feeRecipientAddress: string;
    expirationTimeSeconds: string;
    salt: string;
    signature: string;
}

export interface ERC20TransferEvent {
    from: string;
    to: string;
    value: BigNumber;
}

interface WrapperERC20TransferEvent {
    from: string;
    to: string;
    value: string;
}

export interface ERC20ApprovalEvent {
    owner: string;
    spender: string;
    value: BigNumber;
}

interface WrapperERC20ApprovalEvent {
    owner: string;
    spender: string;
    value: string;
}

export interface ERC721TransferEvent {
    from: string;
    to: string;
    tokenId: BigNumber;
}

interface WrapperERC721TransferEvent {
    from: string;
    to: string;
    tokenId: string;
}

export interface ERC721ApprovalEvent {
    owner: string;
    approved: string;
    tokenId: BigNumber;
}

interface WrapperERC721ApprovalEvent {
    owner: string;
    approved: string;
    tokenId: string;
}

export interface ERC721ApprovalForAllEvent {
    owner: string;
    operator: string;
    approved: boolean;
}

export interface ExchangeFillEvent {
    makerAddress: string;
    takerAddress: string;
    senderAddress: string;
    feeRecipientAddress: string;
    makerAssetFilledAmount: BigNumber;
    takerAssetFilledAmount: BigNumber;
    makerFeePaid: BigNumber;
    takerFeePaid: BigNumber;
    orderHash: string;
    makerAssetData: string;
    takerAssetData: string;
}

interface WrapperExchangeFillEvent {
    makerAddress: string;
    takerAddress: string;
    senderAddress: string;
    feeRecipientAddress: string;
    makerAssetFilledAmount: string;
    takerAssetFilledAmount: string;
    makerFeePaid: string;
    takerFeePaid: string;
    orderHash: string;
    makerAssetData: string;
    takerAssetData: string;
}

export interface ExchangeCancelEvent {
    makerAddress: string;
    senderAddress: string;
    feeRecipientAddress: string;
    orderHash: string;
    makerAssetData: string;
    takerAssetData: string;
}

export interface ExchangeCancelUpToEvent {
    makerAddress: string;
    senderAddress: string;
    orderEpoch: BigNumber;
}

interface WrapperExchangeCancelUpToEvent {
    makerAddress: string;
    senderAddress: string;
    orderEpoch: string;
}

export interface WethWithdrawalEvent {
    owner: string;
    value: BigNumber;
}

interface WrapperWethWithdrawalEvent {
    owner: string;
    value: string;
}

export interface WethDepositEvent {
    owner: string;
    value: BigNumber;
}

interface WrapperWethDepositEvent {
    owner: string;
    value: string;
}

enum ContractEventKind {
    ERC20TransferEvent = 'ERC20TransferEvent',
    ERC20ApprovalEvent = 'ERC20ApprovalEvent',
    ERC721TransferEvent = 'ERC721TransferEvent',
    ERC721ApprovalEvent = 'ERC721ApprovalEvent',
    ExchangeFillEvent = 'ExchangeFillEvent',
    ExchangeCancelEvent = 'ExchangeCancelEvent',
    ExchangeCancelUpToEvent = 'ExchangeCancelUpToEvent',
    WethDepositEvent = 'WethDepositEvent',
    WethWithdrawalEvent = 'WethWithdrawalEvent',
}

type WrapperContractEventParameters =  WrapperERC20TransferEvent | WrapperERC20ApprovalEvent | WrapperERC721TransferEvent | WrapperERC721ApprovalEvent | WrapperExchangeFillEvent | WrapperExchangeCancelUpToEvent | WrapperWethWithdrawalEvent | WrapperWethDepositEvent | ERC721ApprovalForAllEvent | ExchangeCancelEvent;

type ContractEventParameters =  ERC20TransferEvent | ERC20ApprovalEvent | ERC721TransferEvent | ERC721ApprovalEvent | ExchangeFillEvent | ExchangeCancelUpToEvent | WethWithdrawalEvent | WethDepositEvent | ERC721ApprovalForAllEvent | ExchangeCancelEvent;

export interface ContractEvent {
    blockHash: string;
    txHash: string;
    txIndex: number;
    logIndex: number;
    isRemoved: string;
    address: string;
    kind: ContractEventKind;
    parameters: ContractEventParameters;
}

// The type for order events exposed by MeshWrapper.
interface WrapperContractEvent {
    blockHash: string;
    txHash: string;
    txIndex: number;
    logIndex: number;
    isRemoved: string;
    address: string;
    kind: string;
    parameters: WrapperContractEventParameters;
}

export enum OrderEventEndState {
    Invalid = 'INVALID',
    Added = 'ADDED',
    Filled = 'FILLED',
    FullyFilled = 'FULLY_FILLED',
    Cancelled = 'CANCELLED',
    Expired = 'EXPIRED',
    Unfunded = 'UNFUNDED',
    FillabilityIncreased = 'FILLABILITY_INCREASED',
}

interface WrapperOrderEvent {
    orderHash: string;
    signedOrder: WrapperSignedOrder;
    endState: OrderEventEndState;
    fillableTakerAssetAmount: string;
    contractEvents: WrapperContractEvent[];
}

/**
 * Order events are fired by Mesh whenever an order is added, canceled, expired,
 * or filled.
 */
export interface OrderEvent {
    orderHash: string;
    signedOrder: SignedOrder;
    endState: OrderEventEndState;
    fillableTakerAssetAmount: BigNumber;
    contractEvents: ContractEvent[];
}

// The type for validation results exposed by MeshWrapper.
interface WrapperValidationResults {
    accepted: WrapperAcceptedOrderInfo[];
    rejected: WrapperRejectedOrderInfo[];
}

// The type for accepted orders exposed by MeshWrapper.
interface WrapperAcceptedOrderInfo {
    orderHash: string;
    signedOrder: WrapperSignedOrder;
    fillableTakerAssetAmount: string;
    isNew: boolean;
}

// The type for rejected orders exposed by MeshWrapper.
interface WrapperRejectedOrderInfo {
    orderHash: string;
    signedOrder: WrapperSignedOrder;
    kind: RejectedOrderKind;
    status: RejectedOrderStatus;
}

/**
 * Indicates which orders where accepted, which were rejected, and why.
 */
export interface ValidationResults {
    accepted: AcceptedOrderInfo[];
    rejected: RejectedOrderInfo[];
}

/**
 * Info for any orders that were accepted.
 */
export interface AcceptedOrderInfo {
    orderHash: string;
    signedOrder: SignedOrder;
    fillableTakerAssetAmount: BigNumber;
    isNew: boolean;
}

/**
 * Info for any orders that were rejected, including the reason they were
 * rejected.
 */
export interface RejectedOrderInfo {
    orderHash: string;
    signedOrder: SignedOrder;
    kind: RejectedOrderKind;
    status: RejectedOrderStatus;
}

/**
 * A set of categories for rejected orders.
 */
export enum RejectedOrderKind {
    ZeroExValidation = 'ZEROEX_VALIDATION',
    MeshError = 'MESH_ERROR',
    MeshValidation = 'MESH_VALIDATION',
    CoordinatorError = 'COORDINATOR_ERROR',
}

/**
 * Provides more information about why an order was rejected.
 */
export interface RejectedOrderStatus {
    code: string;
    message: string;
}

// We use a global variable to track whether the Wasm code has finished loading.
let isWasmLoaded = false;
const loadEventName = '0xmeshload';
window.addEventListener(loadEventName, () => {
    isWasmLoaded = true;
});

// Start compiling the WebAssembly as soon as the script is loaded. This lets
// us initialize as quickly as possible.
const go = new Go();
WebAssembly.instantiate(wasmBuffer, go.importObject)
    .then(module => {
        go.run(module.instance);
    })
    .catch(err => {
        // tslint:disable-next-line no-console
        console.error('Could not load Wasm');
        // tslint:disable-next-line no-console
        console.error(err);
        // If the Wasm bytecode didn't compile, Mesh won't work. We have no
        // choice but to throw an error.
        setImmediate(() => {
            throw err;
        });
    });

/**
 * The main class for this package. Has methods for receiving order events and
 * sending orders through the 0x Mesh network.
 */
// tslint:disable-next-line max-classes-per-file
export class Mesh {
    private readonly _config: Config;
    private _wrapper?: MeshWrapper;
    private _errHandler?: (err: Error) => void;
    private _orderEventsHandler?: (events: WrapperOrderEvent[]) => void;

    /**
     * Instantiates a new Mesh instance.
     *
     * @param   config               Configuration options for Mesh
     * @return  An instance of Mesh
     */
    constructor(config: Config) {
        this._config = config;
    }

    /**
     * Registers a handler which will be called in the event of a critical
     * error. Note that the handler will not be called for non-critical errors.
     * In order to ensure no errors are missed, this should be called before
     * startAsync.
     *
     * @param   handler               The handler to be called.
     */
    public onError(handler: (err: Error) => void): void {
        this._errHandler = handler;
        if (this._wrapper !== undefined) {
            this._wrapper.onError(this._errHandler);
        }
    }

    /**
     * Registers a handler which will be called for any incoming order events.
     * Order events are fired whenver an order is added, canceled, expired, or
     * filled. In order to ensure no events are missed, this should be called
     * before startAsync.
     *
     * @param   handler                The handler to be called.
     */
    public onOrderEvents(handler: (events: OrderEvent[]) => void): void {
        this._orderEventsHandler = orderEventsHandlerToWrapperOrderEventsHandler(handler);
        if (this._wrapper !== undefined) {
            this._wrapper.onOrderEvents(this._orderEventsHandler);
        }
    }

    /**
     * Starts the Mesh node in the background. Mesh will automatically find
     * peers in the network and begin receiving orders from them.
     */
    public async startAsync(): Promise<void> {
        await waitForLoadAsync();
        this._wrapper = await zeroExMesh.newWrapperAsync(configToWrapperConfig(this._config));
        if (this._orderEventsHandler !== undefined) {
            this._wrapper.onOrderEvents(this._orderEventsHandler);
        }
        if (this._errHandler !== undefined) {
            this._wrapper.onError(this._errHandler);
        }
        return this._wrapper.startAsync();
    }

    /**
     * Validates and adds the given orders to Mesh. If an order is successfully
     * added, Mesh will share it with any peers in the network and start
     * watching it for changes (e.g. filled, canceled, expired). The returned
     * promise will only be rejected if there was an error validating or adding
     * the order; it will not be rejected for any invalid orders (check
     * results.rejected instead).
     *
     * @param   orders                An array of orders to add.
     * @returns Validation results for the given orders, indicating which orders
     * were accepted and which were rejected.
     */
    public async addOrdersAsync(orders: SignedOrder[]): Promise<ValidationResults> {
        await waitForLoadAsync();
        if (this._wrapper === undefined) {
            // If this is called after startAsync, this._wrapper is always
            // defined. This check is here just in case and satisfies the
            // compiler.
            return Promise.reject(new Error('Mesh is still loading. Try again soon.'));
        }
        const meshOrders = orders.map(signedOrderToWrapperSignedOrder);
        const meshResults = await this._wrapper.addOrdersAsync(meshOrders);
        return wrapperValidationResultsToValidationResults(meshResults);
    }
}

async function waitForLoadAsync(): Promise<void> {
    // Note: this approach is not CPU efficient but it avoids race
    // conditions and has the advantage of returning instantaneously if the
    // Wasm code has already loaded.
    while (!isWasmLoaded) {
        await sleepAsync(wasmLoadCheckIntervalMs);
    }
}

async function sleepAsync(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function configToWrapperConfig(config: Config): WrapperConfig {
    const bootstrapList = config.bootstrapList == null ? undefined : config.bootstrapList.join(',');
    return {
        ...config,
        bootstrapList,
    };
}

function wrapperSignedOrderToSignedOrder(wrapperSignedOrder: WrapperSignedOrder): SignedOrder {
    return {
        ...wrapperSignedOrder,
        makerFee: new BigNumber(wrapperSignedOrder.makerFee),
        takerFee: new BigNumber(wrapperSignedOrder.takerFee),
        makerAssetAmount: new BigNumber(wrapperSignedOrder.makerAssetAmount),
        takerAssetAmount: new BigNumber(wrapperSignedOrder.takerAssetAmount),
        salt: new BigNumber(wrapperSignedOrder.salt),
        expirationTimeSeconds: new BigNumber(wrapperSignedOrder.expirationTimeSeconds),
    };
}

function wrapperContractEventsToContractEvents(wrapperContractEvents: WrapperContractEvent[]): ContractEvent[] {
        const contractEvents: ContractEvent[] = [];
        if (wrapperContractEvents === null) {
            return contractEvents;
        }
        wrapperContractEvents.forEach(wrapperContractEvent => {
            const kind = wrapperContractEvent.kind as ContractEventKind;
            const rawParameters = wrapperContractEvent.parameters;
            let parameters: ContractEventParameters;
            switch (kind) {
                case ContractEventKind.ERC20TransferEvent:
                    const erc20TransferEvent = rawParameters as WrapperERC20TransferEvent;
                    parameters = {
                        from: erc20TransferEvent.from,
                        to: erc20TransferEvent.to,
                        value: new BigNumber(erc20TransferEvent.value),
                    };
                    break;
                case ContractEventKind.ERC20ApprovalEvent:
                    const erc20ApprovalEvent = rawParameters as WrapperERC20ApprovalEvent;
                    parameters = {
                        owner: erc20ApprovalEvent.owner,
                        spender: erc20ApprovalEvent.spender,
                        value: new BigNumber(erc20ApprovalEvent.value),
                    };
                    break;
                case ContractEventKind.ERC721TransferEvent:
                    const erc721TransferEvent = rawParameters as WrapperERC721TransferEvent;
                    parameters = {
                        from: erc721TransferEvent.from,
                        to: erc721TransferEvent.to,
                        tokenId: new BigNumber(erc721TransferEvent.tokenId),
                    };
                    break;
                case ContractEventKind.ERC721ApprovalEvent:
                    const erc721ApprovalEvent = rawParameters as WrapperERC721ApprovalEvent;
                    parameters = {
                        owner: erc721ApprovalEvent.owner,
                        approved: erc721ApprovalEvent.approved,
                        tokenId: new BigNumber(erc721ApprovalEvent.tokenId),
                    };
                    break;
                case ContractEventKind.ExchangeFillEvent:
                    const exchangeFillEvent = rawParameters as WrapperExchangeFillEvent;
                    parameters = {
                        makerAddress: exchangeFillEvent.makerAddress,
                        takerAddress: exchangeFillEvent.takerAddress,
                        senderAddress: exchangeFillEvent.senderAddress,
                        feeRecipientAddress: exchangeFillEvent.feeRecipientAddress,
                        makerAssetFilledAmount: new BigNumber(exchangeFillEvent.makerAssetFilledAmount),
                        takerAssetFilledAmount: new BigNumber(exchangeFillEvent.takerAssetFilledAmount),
                        makerFeePaid: new BigNumber(exchangeFillEvent.makerFeePaid),
                        takerFeePaid: new BigNumber(exchangeFillEvent.takerFeePaid),
                        orderHash: exchangeFillEvent.orderHash,
                        makerAssetData: exchangeFillEvent.makerAssetData,
                        takerAssetData: exchangeFillEvent.takerAssetData,
                    };
                    break;
                case ContractEventKind.ExchangeCancelEvent:
                    parameters = rawParameters as ExchangeCancelEvent;
                    break;
                case ContractEventKind.ExchangeCancelUpToEvent:
                    const exchangeCancelUpToEvent = rawParameters as WrapperExchangeCancelUpToEvent;
                    parameters = {
                        makerAddress: exchangeCancelUpToEvent.makerAddress,
                        senderAddress: exchangeCancelUpToEvent.senderAddress,
                        orderEpoch: new BigNumber(exchangeCancelUpToEvent.orderEpoch),
                    };
                    break;
                case ContractEventKind.WethDepositEvent:
                    const wethDepositEvent = rawParameters as WrapperWethDepositEvent;
                    parameters = {
                        owner: wethDepositEvent.owner,
                        value: new BigNumber(wethDepositEvent.value),
                    };
                    break;
                case ContractEventKind.WethWithdrawalEvent:
                    const wethWithdrawalEvent = rawParameters as WrapperWethWithdrawalEvent;
                    parameters = {
                        owner: wethWithdrawalEvent.owner,
                        value: new BigNumber(wethWithdrawalEvent.value),
                    };
                    break;
                default:
                    throw new Error(`Unrecognized ContractEventKind: ${kind}`);
            }
            const contractEvent: ContractEvent = {
                blockHash: wrapperContractEvent.blockHash,
                txHash:  wrapperContractEvent.txHash,
                txIndex:  wrapperContractEvent.txIndex,
                logIndex:  wrapperContractEvent.logIndex,
                isRemoved:  wrapperContractEvent.isRemoved,
                address:  wrapperContractEvent.address,
                kind,
                parameters,
            };
            contractEvents.push(contractEvent);
        });
        return contractEvents;
    }

function signedOrderToWrapperSignedOrder(signedOrder: SignedOrder): WrapperSignedOrder {
    return {
        ...signedOrder,
        makerFee: signedOrder.makerFee.toString(),
        takerFee: signedOrder.takerFee.toString(),
        makerAssetAmount: signedOrder.makerAssetAmount.toString(),
        takerAssetAmount: signedOrder.takerAssetAmount.toString(),
        salt: signedOrder.salt.toString(),
        expirationTimeSeconds: signedOrder.expirationTimeSeconds.toString(),
    };
}

function wrapperOrderEventToOrderEvent(wrapperOrderEvent: WrapperOrderEvent): OrderEvent {
    return {
        ...wrapperOrderEvent,
        signedOrder: wrapperSignedOrderToSignedOrder(wrapperOrderEvent.signedOrder),
        fillableTakerAssetAmount: new BigNumber(wrapperOrderEvent.fillableTakerAssetAmount),
        contractEvents: wrapperContractEventsToContractEvents(wrapperOrderEvent.contractEvents),
    };
}

function orderEventsHandlerToWrapperOrderEventsHandler(
    orderEventsHandler: (events: OrderEvent[]) => void,
): (events: WrapperOrderEvent[]) => void {
    return (wrapperOrderEvents: WrapperOrderEvent[]) => {
        const orderEvents = wrapperOrderEvents.map(wrapperOrderEventToOrderEvent);
        orderEventsHandler(orderEvents);
    };
}

function wrapperValidationResultsToValidationResults(
    wrapperValidationResults: WrapperValidationResults,
): ValidationResults {
    return {
        accepted: wrapperValidationResults.accepted.map(wrapperAcceptedOrderInfoToAcceptedOrderInfo),
        rejected: wrapperValidationResults.rejected.map(wrapperRejectedOrderInfoToRejectedOrderInfo),
    };
}

function wrapperAcceptedOrderInfoToAcceptedOrderInfo(
    wrapperAcceptedOrderInfo: WrapperAcceptedOrderInfo,
): AcceptedOrderInfo {
    return {
        ...wrapperAcceptedOrderInfo,
        signedOrder: wrapperSignedOrderToSignedOrder(wrapperAcceptedOrderInfo.signedOrder),
        fillableTakerAssetAmount: new BigNumber(wrapperAcceptedOrderInfo.fillableTakerAssetAmount),
    };
}

function wrapperRejectedOrderInfoToRejectedOrderInfo(
    wrapperRejectedOrderInfo: WrapperRejectedOrderInfo,
): RejectedOrderInfo {
    return {
        ...wrapperRejectedOrderInfo,
        signedOrder: wrapperSignedOrderToSignedOrder(wrapperRejectedOrderInfo.signedOrder),
    };
}
