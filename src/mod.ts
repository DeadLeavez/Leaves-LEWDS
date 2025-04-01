import { DependencyContainer } from "tsyringe";

import { ILogger } from "@spt/models/spt/utils/ILogger";
import { DatabaseServer } from "@spt/servers/DatabaseServer";

//Mod setup
import { OnLoadModService } from "@spt/services/mod/onLoad/OnLoadModService";
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { PreSptModLoader } from "@spt/loaders/PreSptModLoader";

import { DBPLocation, DBPLocations, LeavesUtils, RTT_Colors, UnityVector3 } from "./deps/LeavesUtils";
import { LogTextColor } from "@spt/models/spt/logging/LogTextColor";
import { spawn } from "node:child_process";


class LEWDS implements IPostDBLoadMod, IPreSptLoadMod
{
	private logger: ILogger;

	private db: DatabaseServer;

	//Config
	private config: any;
	private leavesUtils: LeavesUtils;

	public postDBLoad ( container: DependencyContainer ): void
	{
		// Get stuff from the server container.
		this.logger = container.resolve<ILogger>( "WinstonLogger" );

		// Get database from server.
		this.db = container.resolve<DatabaseServer>( "DatabaseServer" );

		// get output directory for generated files
		// "Leaves-LootFuckery" is the directory name of the mod
		const preSptModLoader = container.resolve<PreSptModLoader>( "PreSptModLoader" );

		this.leavesUtils = new LeavesUtils( container );
		this.leavesUtils.setModFolder( `${ preSptModLoader.getModPath( "leaves-lewds" ) }/` );
		this.config = this.leavesUtils.loadFile( "config/config.jsonc" );
	}

	public preSptLoad ( container: DependencyContainer ): void
	{
		const logger = container.resolve<ILogger>( "WinstonLogger" );
		const onLoadModService = container.resolve<OnLoadModService>( "OnLoadModService" );

		// run mod logic _after_ all mods have resolved
		onLoadModService.registerOnLoad
			(
				//No idea what this all means. I blame chomp.
				"LEWDS-mod", // route key
				() => this.OnLoad( logger ),
				() => "LEWDS" // new route name
			);
	}

	public OnLoad ( logger: ILogger ): void
	{
		this.logger.info( "[L.E.W.D.S.] Leaves - L.E.W.D.S. Starting:" );

		if ( !this.db )
		{
			this.logger.error( "db not initialized. ??" )
			return;
		}

		let DBPLocs: DBPLocations = new DBPLocations();
		DBPLocs.locations = new Map<string, DBPLocation[]>();

		const locations = this.getLocationNames();
		for ( let location of locations )
		{
			let totalAdjusted = 0;
			DBPLocs.locations[ location ] = [];
			for ( let point of this.db.getTables().locations[ location ].looseLoot.spawnpoints )
			{
				if( this.adjustPoint( point, DBPLocs.locations[location] ) )
				{
					totalAdjusted++;
				}
			}
			this.logger.info( "[L.E.W.D.S.] Found " + totalAdjusted + " spawns below floor at " + location + "." );
		}

		this.leavesUtils.saveFile( DBPLocs, "points.json", true );
	}

	private adjustPoint ( point: any, points:DBPLocation[] ): boolean
	{
		const itemTable = this.db.getTables().templates.items;
		const items = point.template.Items;
		let adjusted = false;
		let probability = 0;
		let foundItems: Point[] = [];
		
		for ( const item of items )
		{
			//If an entry has a parent, it's not the top node in the entry. So we skip it.
			if ( item.parentId )
			{
				continue;
			}
			//Check if the item even exists.
			if ( !itemTable[ item._tpl ] )
			{
				continue;
			}

			if ( this.config.categories[ itemTable[ item._tpl ]._parent ] || this.config.items[item._tpl] )
			{
				adjusted = true;
				const newProb = this.config.categories[ itemTable[ item._tpl ]._parent ] ? this.config.categories[ itemTable[ item._tpl ]._parent ] : this.config.items[item._tpl];
				if ( newProb > probability )
				{
					probability = newProb;
				}
				if ( this.config.GenerateLocationJsonForDBP )
				{
					foundItems.push( new Point( item._tpl, this.findWeight(item._id, point.itemDistribution) ) );
				}
			}
		}
		if ( adjusted )
		{
			var newPoint: DBPLocation;
			if ( this.config.GenerateBefore )
			{
				newPoint = this.populateDBPLocation( foundItems, point );
			}
			if ( probability > point.probability )
			{
				point.probability = probability;
			}
			if ( !this.config.GenerateBefore )
			{
				newPoint = this.populateDBPLocation( foundItems, point );
			}
			newPoint.coordinates.y += 0.07;
			points.push( newPoint );
			return true;
		}
		return false;
	}

	private findWeight( itemID:string, itemDist:any ): number
	{
		for ( const entry of itemDist )
		{
			if ( entry.composedKey.key === itemID )
			{
				return entry.relativeProbability;
			}
		}
		return 0;
	}

	private getTotalWeight( point: any )
	{
		let total = 0;
		for ( const entry of point.itemDistribution )
		{
			total += entry.relativeProbability;
		}
		return total;
	}

	private lootFormula( x:number ):number
	{
		//y = ax^3 + bx^2 + cx + d
		/*
		a 1.471e+00 6.338e-02
		b -3.331e+00 8.385e-02
		c 2.802e+00 2.350e-02
		d 2.555e-03 9.961e-04
		*/

		const a = 1.471e+00;
		const b = -3.331e+00;
		const c = 2.802e+00;
		const d = 2.555e-03;

		return a * Math.pow( x, 3 ) + b * Math.pow( x, 2 ) + c * x + d;
	}

	private populateDBPLocation( items: Point[], spawnPoint:any  ): DBPLocation
	{
		const totalWeight = this.getTotalWeight( spawnPoint );
		let loc = this.leavesUtils.getBaseDBPLocation();
		let text = "\n";

		for ( let item of items )
		{
			text += this.leavesUtils.getLocale( "en", item.itemID, " Name" ) + ` [${parseFloat((item.weight/totalWeight*100).toFixed(2)).toString()}%]` + "\n";
		}
		loc.coordinates = spawnPoint.template.Position;
		loc.text = text;
		loc.label = "Point:" + parseFloat((spawnPoint.probability*100).toFixed(2)).toString() + "%" + `[r:${parseFloat((this.lootFormula(spawnPoint.probability)*100).toFixed(2)).toString()}%]`;

		return loc;
	}

	private getLocationNames (): string[]
	{
		let locationNames = [];
		const locations = this.db.getTables().locations;

		for ( const locationName in locations )
		{
			const location = locations[ locationName ];

			if ( location.looseLoot !== undefined )
			{
				locationNames.push( location.base.Id.toLowerCase() );
			}
		}

		return locationNames;
	}
}

export class Point
{
	constructor( id, weight )
	{
		this.itemID = id;
		this.weight = weight;
	}
	itemID: string;
	weight: number;
}

module.exports = { mod: new LEWDS() }