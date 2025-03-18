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
		let foundItems: string[] = [];
		
		for ( const item of items )
		{
			//If an entry has a parent, it's not the top node in the entry. So we skip it.
			if ( item.parentId )
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
					foundItems.push( item._tpl );
				}
			}
		}
		if ( adjusted )
		{
			if ( probability > point.probability )
			{
				point.probability = probability;
			}
			var newPoint = this.populateDBPLocation( foundItems, point.template.Position );
			newPoint.coordinates.y += 0.07;
			points.push( newPoint );
			return true;
		}
		return false;
	}

	private populateDBPLocation( items: string[], position:UnityVector3 ): DBPLocation
	{
		const itemTable = this.db.getTables().templates.items;
		let loc = this.leavesUtils.getBaseDBPLocation();
		let text = "";

		for ( let item of items )
		{
			text += this.leavesUtils.getLocale( "en", item, " Name" ) + "\n";
		}
		loc.coordinates = position;
		loc.text = text;

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

module.exports = { mod: new LEWDS() }