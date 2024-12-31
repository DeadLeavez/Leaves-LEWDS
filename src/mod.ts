import { DependencyContainer } from "tsyringe";

import { ILogger } from "@spt/models/spt/utils/Ilogger";
import { DatabaseServer } from "@spt/servers/DatabaseServer";

//Mod setup
import { OnLoadModService } from "@spt/services/mod/onLoad/OnLoadModService";
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { PreSptModLoader } from "@spt/loaders/PreSptModLoader";


class LEWDS implements IPostDBLoadMod, IPreSptLoadMod
{
	private logger: ILogger;

	private db: DatabaseServer;

	//Config
	private config = require( "../config/config.json" );

	public postDBLoad ( container: DependencyContainer ): void
	{
		// Get stuff from the server container.
		this.logger = container.resolve<ILogger>( "WinstonLogger" );

		// Get database from server.
		this.db = container.resolve<DatabaseServer>( "DatabaseServer" );

		// get output directory for generated files
		// "Leaves-LootFuckery" is the directory name of the mod
		const preSptModLoader = container.resolve<PreSptModLoader>( "PreSptModLoader" );
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

		const locations = this.getLocationNames();
		for ( let location of locations )
		{
			let totalAdjusted = 0;
			
			for ( let point of this.db.getTables().locations[ location ].looseLoot.spawnpoints )
			{
				if( this.adjustPoint( point ) )
				{
					totalAdjusted++;
				}
			}
			this.logger.info( "[L.E.W.D.S.] Found " + totalAdjusted + " spawns below floor at " + location + "." );
		}

	}

	private adjustPoint ( point: any ): boolean
	{
		const itemTable = this.db.getTables().templates.items;
		const items = point.template.Items;
		const probabilityFloor = this.config.probabilityFloor;
		let isWeapon = false;
		let adjust = false;

		for ( const item in point.template.Items )
		{
			//If an entry has a parent, it's not the top node in the entry. So we skip it.
			if ( items[ item ].parentId )
			{
				continue;
			}

			const parent = itemTable[ items[ item ]._tpl ]._parent;

			if ( itemTable[ parent ]._parent )
			{
				if ( itemTable[ parent ]._parent == "5422acb9af1c889c16000029" )//Weapon
				{
					isWeapon = true;
					break;
				}
			}
		}

		if ( this.config.onlyWeapons && isWeapon )
		{
			adjust = true;
		}

		if( this.config.onlyWeapons == false )
		{
			adjust = true;
		}

		if ( adjust && point.probability < probabilityFloor )
		{
			point.probability = probabilityFloor;
			return true;
		}

		return false;
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