import { createEmptyMockDriver } from "../../../test/mocks";
import { Driver } from "../driver/Driver";
import { IDriver } from "../driver/IDriver";
import { ZWaveNode } from "../node/Node";
import {
	BinarySensorCC,
	BinarySensorCCGet,
	BinarySensorCCReport,
	BinarySensorCCSupportedGet,
	BinarySensorCCSupportedReport,
	BinarySensorCommand,
	BinarySensorType,
} from "./BinarySensorCC";
import { CommandClasses } from "./CommandClasses";

function buildCCBuffer(nodeId: number, payload: Buffer): Buffer {
	return Buffer.concat([
		Buffer.from([
			nodeId, // node number
			payload.length + 1, // remaining length
			CommandClasses["Binary Sensor"], // CC
		]),
		payload,
	]);
}

describe("lib/commandclass/BinarySensorCC => ", () => {
	const fakeDriver = (createEmptyMockDriver() as unknown) as IDriver;
	let node1: ZWaveNode;

	beforeAll(() => {
		node1 = new ZWaveNode(1, (fakeDriver as any) as Driver);
		(fakeDriver.controller.nodes as Map<any, any>).set(node1.id, node1);
	});

	it("the Get command (v1) should serialize correctly", () => {
		const cc = new BinarySensorCCGet(fakeDriver, { nodeId: 1 });
		const expected = buildCCBuffer(
			1,
			Buffer.from([
				BinarySensorCommand.Get, // CC Command
			]),
		);
		expect(cc.serialize()).toEqual(expected);
	});

	it("the Get command (v2) should serialize correctly", () => {
		const cc = new BinarySensorCCGet(fakeDriver, {
			nodeId: 1,
			sensorType: BinarySensorType.CO,
		});
		const expected = buildCCBuffer(
			1,
			Buffer.from([BinarySensorCommand.Get, BinarySensorType.CO]),
		);
		expect(cc.serialize()).toEqual(expected);
	});

	it("the Report command (v1) should be deserialized correctly", () => {
		const ccData = buildCCBuffer(
			1,
			Buffer.from([
				BinarySensorCommand.Report, // CC Command
				0xff, // current value
			]),
		);
		const cc = new BinarySensorCCReport(fakeDriver, { data: ccData });

		expect(cc.value).toBe(true);
	});

	it("the Report command (v2) should be deserialized correctly", () => {
		const ccData = buildCCBuffer(
			1,
			Buffer.from([
				BinarySensorCommand.Report, // CC Command
				0x00, // current value
				BinarySensorType.CO2,
			]),
		);
		const cc = new BinarySensorCCReport(fakeDriver, { data: ccData });

		expect(cc.value).toBe(false);
		expect(cc.type).toBe(BinarySensorType.CO2);
	});

	it("the SupportedGet command should serialize correctly", () => {
		const cc = new BinarySensorCCSupportedGet(fakeDriver, { nodeId: 1 });
		const expected = buildCCBuffer(
			1,
			Buffer.from([
				BinarySensorCommand.SupportedGet, // CC Command
			]),
		);
		expect(cc.serialize()).toEqual(expected);
	});

	it("the SupportedReport command should be deserialized correctly", () => {
		const ccData = buildCCBuffer(
			1,
			Buffer.from([
				BinarySensorCommand.SupportedReport, // CC Command
				0b01010101,
				1,
			]),
		);
		const cc = new BinarySensorCCSupportedReport(fakeDriver, {
			data: ccData,
		});

		expect(cc.supportedSensorTypes).toEqual([
			BinarySensorType["General Purpose"],
			BinarySensorType.CO,
			BinarySensorType.Heat,
			BinarySensorType.Freeze,
			BinarySensorType.Aux,
		]);
	});

	it("deserializing an unsupported command should return an unspecified version of BinarySensorCC", () => {
		const serializedCC = buildCCBuffer(
			1,
			Buffer.from([255]), // not a valid command
		);
		const cc: any = new BinarySensorCC(fakeDriver, {
			data: serializedCC,
		});
		expect(cc.constructor).toBe(BinarySensorCC);
	});

	// it("the CC values should have the correct metadata", () => {
	// 	// Readonly, 0-99
	// 	const currentValueMeta = getCCValueMetadata(
	// 		CommandClasses["Binary Sensor"],
	// 		"currentValue",
	// 	);
	// 	expect(currentValueMeta).toMatchObject({
	// 		readable: true,
	// 		writeable: false,
	// 		min: 0,
	// 		max: 99,
	// 	});

	// 	// Writeable, 0-99
	// 	const targetValueMeta = getCCValueMetadata(
	// 		CommandClasses["Binary Sensor"],
	// 		"targetValue",
	// 	);
	// 	expect(targetValueMeta).toMatchObject({
	// 		readable: true,
	// 		writeable: true,
	// 		min: 0,
	// 		max: 99,
	// 	});
	// });
});
